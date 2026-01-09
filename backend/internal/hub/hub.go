package hub

import (
	"encoding/json"
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

			// Broadcast presence update
			h.broadcastPresence()

		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				h.qt.Remove(client)
				delete(h.clients, client)
				if client.ID != "" {
					delete(h.clientsByID, client.ID)
				}
				close(client.send)

				// Broadcast presence update
				h.broadcastPresence()
			}

		case action := <-h.actions:
			action()
		}
	}
}

// broadcastPresence sends the current user list to all clients
func (h *Hub) broadcastPresence() {
	users := make([]protocol.UserPresence, 0, len(h.clients))
	for client := range h.clients {
		if client.ID != "" {
			users = append(users, protocol.UserPresence{
				UserId:   client.ID,
				UserName: client.Name,
				Color:    client.Color,
				Online:   true,
			})
		}
	}

	msg := protocol.ServerMessage{
		Type:  "presence",
		Users: users,
	}

	data, err := json.Marshal(msg)
	if err != nil {
		log.Println("Error marshaling presence:", err)
		return
	}

	for client := range h.clients {
		select {
		case client.send <- data:
		default:
			// Skip if buffer full
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
			client.Name = payload.UserName
			h.clientsByID[newID] = client

			// Broadcast updated presence
			h.broadcastPresence()
		}

	case "join_room":
		// Handle room joining (for future room-based filtering)
		if msg.RoomId != "" {
			client.RoomID = msg.RoomId
			log.Printf("Client %s joined room %s", client.ID, msg.RoomId)
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
		if msg.DrawOp != nil && len(msg.DrawOp) > 0 {
			// 1. Persistence (Write-Behind)
			// Parse the draw operation
			var drawOp protocol.DrawOp
			if err := json.Unmarshal(msg.DrawOp, &drawOp); err == nil {
				drawOp.UserId = client.ID
				if h.store != nil {
					// Re-encode for storage
					go func() {
						// Store as JSON in database
						// For now just log it
						log.Printf("Draw op from %s: type=%s id=%s", client.ID, drawOp.Type, drawOp.Id)
					}()
				}
			}

			// 2. Broadcast to all clients in the same room or viewport
			h.broadcastDraw(client, raw)
		}

	case "cursor":
		// Handle cursor movement for live cursors
		// Broadcast to nearby clients
		h.broadcastToOthers(client, raw)

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

// broadcastDraw sends draw operation to relevant clients
func (h *Hub) broadcastDraw(sender *Client, raw []byte) {
	// If sender is in a room, only broadcast to room members
	if sender.RoomID != "" {
		for client := range h.clients {
			if client.ID != sender.ID && client.RoomID == sender.RoomID {
				select {
				case client.send <- raw:
				default:
					h.removeClient(client)
				}
			}
		}
		return
	}

	// Otherwise use spatial broadcast
	neighbors := h.qt.Query(sender.Viewport)
	for _, item := range neighbors {
		neighbor, ok := item.(*Client)
		if !ok || neighbor.ID == sender.ID {
			continue
		}

		select {
		case neighbor.send <- raw:
		default:
			h.removeClient(neighbor)
		}
	}
}

// broadcastToOthers sends message to all other clients
func (h *Hub) broadcastToOthers(sender *Client, raw []byte) {
	for client := range h.clients {
		if client.ID != sender.ID {
			select {
			case client.send <- raw:
			default:
				// Skip if buffer full
			}
		}
	}
}

// removeClient cleans up a disconnected client
func (h *Hub) removeClient(client *Client) {
	close(client.send)
	delete(h.clients, client)
	delete(h.clientsByID, client.ID)
	h.qt.Remove(client)
}
