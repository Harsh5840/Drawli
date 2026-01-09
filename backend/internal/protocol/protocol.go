package protocol

import "encoding/json"

// ClientMessage is the container for all messages from clients
type ClientMessage struct {
	Type      string          `json:"type"` // "handshake", "draw", "viewport", "signal", "join_room"
	Handshake *Handshake      `json:"handshake,omitempty"`
	DrawOp    json.RawMessage `json:"drawOp,omitempty"` // Flexible shape data from frontend
	Viewport  *ViewportUpdate `json:"viewport,omitempty"`
	SignalOp  *WebRTCSignal   `json:"signalOp,omitempty"`
	RoomId    string          `json:"roomId,omitempty"`
}

// ServerMessage is the container for all messages to clients
type ServerMessage struct {
	Type   string          `json:"type"` // "draw", "cursor", "presence", "error"
	DrawOp json.RawMessage `json:"drawOp,omitempty"`
	Cursor *CursorUpdate   `json:"cursor,omitempty"`
	Users  []UserPresence  `json:"users,omitempty"`
	Error  string          `json:"error,omitempty"`
}

type Handshake struct {
	UserId   string `json:"userId"`
	UserName string `json:"userName"`
}

// DrawOp represents any shape on the canvas
// We use json.RawMessage in ClientMessage to accept any shape type
// Here's the expected shape structure for reference:
type DrawOp struct {
	Id          string  `json:"id"`
	Type        string  `json:"type"` // "rect", "ellipse", "line", "arrow", "text", "freehand", "diamond"
	UserId      string  `json:"userId,omitempty"`
	StrokeColor string  `json:"strokeColor,omitempty"`
	StrokeWidth float64 `json:"strokeWidth,omitempty"`
	FillColor   string  `json:"fillColor,omitempty"`

	// For rect, diamond
	X      float64 `json:"x,omitempty"`
	Y      float64 `json:"y,omitempty"`
	Width  float64 `json:"width,omitempty"`
	Height float64 `json:"height,omitempty"`

	// For ellipse
	Cx float64 `json:"cx,omitempty"`
	Cy float64 `json:"cy,omitempty"`
	Rx float64 `json:"rx,omitempty"`
	Ry float64 `json:"ry,omitempty"`

	// For line, arrow
	X1 float64 `json:"x1,omitempty"`
	Y1 float64 `json:"y1,omitempty"`
	X2 float64 `json:"x2,omitempty"`
	Y2 float64 `json:"y2,omitempty"`

	// For text
	Text     string  `json:"text,omitempty"`
	FontSize float64 `json:"fontSize,omitempty"`

	// For freehand
	Points []Point `json:"points,omitempty"`
}

type Point struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type ViewportUpdate struct {
	X      float64 `json:"x"`
	Y      float64 `json:"y"`
	Width  float64 `json:"width"`
	Height float64 `json:"height"`
}

type CursorUpdate struct {
	UserId   string  `json:"userId"`
	UserName string  `json:"userName"`
	X        float64 `json:"x"`
	Y        float64 `json:"y"`
	Color    string  `json:"color"`
}

type UserPresence struct {
	UserId   string `json:"userId"`
	UserName string `json:"userName"`
	Color    string `json:"color"`
	Online   bool   `json:"online"`
}

type WebRTCSignal struct {
	TargetUserId string `json:"targetUserId"`
	Type         string `json:"type"` // "offer", "answer", "candidate"
	Sdp          string `json:"sdp"`
	Candidate    string `json:"candidate"`
}
