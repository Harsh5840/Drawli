package protocol

// ClientMessage is the container for all messages
type ClientMessage struct {
	Type      string          `json:"type"` // "handshake", "draw", "viewport", "signal"
	Handshake *Handshake      `json:"handshake,omitempty"`
	DrawOp    *DrawOp         `json:"drawOp,omitempty"`
	Viewport  *ViewportUpdate `json:"viewport,omitempty"`
	SignalOp  *WebRTCSignal   `json:"signalOp,omitempty"`
}

type Handshake struct {
	UserId   string `json:"userId"`
	UserName string `json:"userName"`
}

type DrawOp struct {
	Id     string  `json:"id"`
	UserId string  `json:"userId"`
	X      float64 `json:"x"`
	Y      float64 `json:"y"`
	Color  string  `json:"color"`
}

type ViewportUpdate struct {
	X      float64 `json:"x"`
	Y      float64 `json:"y"`
	Width  float64 `json:"width"`
	Height float64 `json:"height"`
}

type WebRTCSignal struct {
	TargetUserId string `json:"targetUserId"`
	Type         string `json:"type"` // "offer", "answer", "candidate"
	Sdp          string `json:"sdp"`
	Candidate    string `json:"candidate"`
}
