package hub

import (
	"log"

	"github.com/user/drawli/internal/protocol"
	"github.com/user/drawli/internal/quadtree"
	"github.com/user/drawli/internal/storage"
)

// Hub maintains the set of active clients and broadcasts messages.
type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	// Map for fast lookup by ID (needed for WebRTC)
	clientsByID map[string]*Client

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client

	// Actions to execute in the main loop (thread-safety)
	actions chan func()

	// Storage
	store storage.Store

	// Spatial Engine
	qt *quadtree.Quadtree
}

func NewHub(store storage.Store) *Hub {
	bounds := quadtree.Bounds{
		X: -1000000, Y: -1000000, Width: 2000000, Height: 2000000,
	}
	return &Hub{
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		clients:     make(map[*Client]bool),
		clientsByID: make(map[string]*Client),
		actions:     make(chan func()),
		store:       store,
		qt:          quadtree.New(bounds, 10, 10),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			if client.ID != "" {
				h.clientsByID[client.ID] = client
			}
			h.qt.Insert(client)

		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				h.qt.Remove(client)
				delete(h.clients, client)
				if client.ID != "" {
					delete(h.clientsByID, client.ID)
				}
				close(client.send)
			}

		case action := <-h.actions:
			action()
		}
	}
}

// processMessage sends a closure to be executed in the main Hub loop
func (h *Hub) processMessage(client *Client, msg *protocol.ClientMessage, raw []byte) {
	h.actions <- func() {
		h.handleMessage(client, msg, raw)
	}
}

func (h *Hub) handleMessage(client *Client, msg *protocol.ClientMessage, raw []byte) {
	switch msg.Type {

	case "handshake":
		if payload := msg.Handshake; payload != nil {
			// Update Identity
			oldID := client.ID
			newID := payload.UserId

			if oldID != "" {
				delete(h.clientsByID, oldID)
			}

			client.ID = newID
			h.clientsByID[newID] = client
		}

	case "viewport":
		if payload := msg.Viewport; payload != nil {
			// Remove with current state
			h.qt.Remove(client)

			// Update state
			v := payload
			client.Viewport = quadtree.Bounds{
				X: v.X, Y: v.Y, Width: v.Width, Height: v.Height,
			}

			// Insert with new state
			h.qt.Insert(client)
		}

	case "draw":
		if payload := msg.DrawOp; payload != nil {
			// 1. Persistence (Write-Behind)
			// SaveOp pushes to channel -> fast.
			if h.store != nil {
				go h.store.SaveOp(payload)
			}

			// 2. Spatial Broadcast
			// "Call Quadtree.Query(sender.Viewport) to find neighbors."
			neighbors := h.qt.Query(client.Viewport)
			for _, item := range neighbors {
				neighbor, ok := item.(*Client)
				if !ok || neighbor.ID == client.ID {
					continue
				}

				select {
				case neighbor.send <- raw:
				default:
					close(neighbor.send)
					delete(h.clients, neighbor)
					delete(h.clientsByID, neighbor.ID)
					h.qt.Remove(neighbor)
				}
			}
		}

	case "signal":
		if payload := msg.SignalOp; payload != nil {
			// P2P Routing
			targetID := payload.TargetUserId
			if target, ok := h.clientsByID[targetID]; ok {
				select {
				case target.send <- raw:
				default:
					// Target congested
				}
			} else {
				log.Printf("WebRTC Signal: Target %s not found", targetID)
			}
		}
	}
}
