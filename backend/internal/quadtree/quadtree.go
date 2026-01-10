package quadtree

import (
	"sync"
)

// Bounds represents a rectangular area
type Bounds struct {
	X, Y   float64
	Width  float64
	Height float64
}

// Intersects checks if two bounds overlap
func (b Bounds) Intersects(other Bounds) bool {
	return b.X < other.X+other.Width &&
		b.X+b.Width > other.X &&
		b.Y < other.Y+other.Height &&
		b.Y+b.Height > other.Y
}

// Contains checks if the bounds contains another bounds (fully) or point
// Simplified for point/item center logic if needed, but here we use connection
func (b Bounds) Contains(other Bounds) bool {
	return other.X >= b.X &&
		other.X+other.Width <= b.X+b.Width &&
		other.Y >= b.Y &&
		other.Y+other.Height <= b.Y+b.Height
}

// Item represents an object stored in the Quadtree
type Item interface {
	GetID() string
	GetBounds() Bounds
}

// Quadtree is a thread-safe spatial indexing structure
type Quadtree struct {
	mu        sync.RWMutex
	bounds    Bounds
	capacity  int
	maxLevels int
	level     int
	items     []Item
	nodes     []*Quadtree // NW, NE, SW, SE
	divided   bool
}

// New creates a new Quadtree node
func New(bounds Bounds, capacity, maxLevels int) *Quadtree {
	return &Quadtree{
		bounds:    bounds,
		capacity:  capacity,
		maxLevels: maxLevels,
		level:     0,
		items:     make([]Item, 0),
	}
}

// Insert adds an item to the Quadtree
func (qt *Quadtree) Insert(item Item) bool {
	qt.mu.Lock()
	defer qt.mu.Unlock()
	return qt.insert(item)
}

// insert internal recursive function
func (qt *Quadtree) insert(item Item) bool {
	if !qt.bounds.Intersects(item.GetBounds()) {
		return false
	}

	if qt.divided {
		for _, node := range qt.nodes {
			if node.insert(item) {
				return true
			}
		}
		// If it doesn't fit into a child (e.g. overlaps multiple), keep it in this node
		// Note: Standard point quadtrees push to children. Region quadtrees might keep overlapping items in parent.
		// For simplicity/correctness with "Move", keeping it in parent if it doesn't fit children is safer,
		// OR we add to all overlapping nodes.
		// Let's assume point-based or small-object based: we try to push down.
		// If it's a Viewport (Client), it might be large.
		// Strategy: Add to ALL intersecting nodes? Or just the one that fully contains it?
		// "The server queries the Quadtree... returns clients"
		// If a Client Viewport is the Item, it's large.
		// Actually, usually Quadtree stores *Objects* (Lines), and we Query with *Viewport*.
		// Prompt says: "Every connected Client should be inserted into the Quadtree based on their Viewport coordinates. Implement a Query(bounds) method that returns a list of Clients."
		// Ah, so Clients ARE the items.
		// Clients have large bounds (Screen size).
		// If a Client overlaps multiple nodes, it should probably be in all of them or the parent.
		// Let's stick to: Store in the deepest node that FULLY contains the item.
		// If it splits lines, store in parent.
	}

	// Try to add to this node
	// If full and not max level, subdivide
	if len(qt.items) < qt.capacity || qt.level >= qt.maxLevels {
		qt.items = append(qt.items, item)
		return true
	}

	if !qt.divided {
		qt.subdivide()
	}

	// Try children again after subdivision
	// If it fits fully in a child, move it there.
	// For the new item:
	for _, node := range qt.nodes {
		if node.bounds.Contains(item.GetBounds()) {
			return node.insert(item)
		}
	}

	// If it doesn't fit fully in any child, keep it here
	qt.items = append(qt.items, item)
	return true
}

func (qt *Quadtree) subdivide() {
	x := qt.bounds.X
	y := qt.bounds.Y
	w := qt.bounds.Width / 2
	h := qt.bounds.Height / 2
	level := qt.level + 1

	qt.nodes = []*Quadtree{
		{bounds: Bounds{x, y, w, h}, capacity: qt.capacity, maxLevels: qt.maxLevels, level: level},         // NW
		{bounds: Bounds{x + w, y, w, h}, capacity: qt.capacity, maxLevels: qt.maxLevels, level: level},     // NE
		{bounds: Bounds{x, y + h, w, h}, capacity: qt.capacity, maxLevels: qt.maxLevels, level: level},     // SW
		{bounds: Bounds{x + w, y + h, w, h}, capacity: qt.capacity, maxLevels: qt.maxLevels, level: level}, // SE
	}
	qt.divided = true
	
	// Re-distribute existing items?
	// Yes, strictly we should, but for MVP keep it simple or implement rebalance.
	// We'll skip rebalance for now to avoid complexity bugs, or do it if simple.
}

// Remove removes an item from the Quadtree. 
// We generally need the bounds to find where it is efficiently.
func (qt *Quadtree) Remove(item Item) bool {
	qt.mu.Lock()
	defer qt.mu.Unlock()
	return qt.remove(item)
}

func (qt *Quadtree) remove(item Item) bool {
	if !qt.bounds.Intersects(item.GetBounds()) {
		return false
	}

	// Check children first
	if qt.divided {
		for _, node := range qt.nodes {
			// If we put it in a child only if it fully contained...
			// But here we rely on the same logic as Insert.
			// If Contains is true, it might be in that child.
			if node.bounds.Contains(item.GetBounds()) {
				if node.remove(item) {
					return true
				}
			}
		}
	}

	// Check this node
	for i, it := range qt.items {
		if it.GetID() == item.GetID() {
			// Fast delete
			qt.items[i] = qt.items[len(qt.items)-1]
			qt.items = qt.items[:len(qt.items)-1]
			// Check if we can merge? (Optimization: skip for now)
			return true
		}
	}

	return false
}

// Query returns all items that intersect with the given range
func (qt *Quadtree) Query(rangeBounds Bounds) []Item {
	qt.mu.RLock()
	defer qt.mu.RUnlock()
	
	var found []Item
	qt.query(rangeBounds, &found)
	return found
}

func (qt *Quadtree) query(rangeBounds Bounds, found *[]Item) {
	if !qt.bounds.Intersects(rangeBounds) {
		return
	}

	for _, item := range qt.items {
		if rangeBounds.Intersects(item.GetBounds()) {
			*found = append(*found, item)
		}
	}

	if qt.divided {
		for _, node := range qt.nodes {
			node.query(rangeBounds, found)
		}
	}
}
