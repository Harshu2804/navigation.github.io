const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
const findPathBtn = document.getElementById('findPathBtn');
const resetBtn = document.getElementById('resetBtn');
const output = document.getElementById('output');

let nodes = [];
let edges = [];
let startNode = null;
let endNode = null;

let draggingEdge = null; // {fromNode, toX, toY} during drag

// Add node on canvas click (if not clicking on node)
canvas.addEventListener('click', (e) => {
  if (isOverNode(e.offsetX, e.offsetY)) return; // Ignore if clicking on node

  nodes.push({ id: nodes.length, x: e.offsetX, y: e.offsetY });
  draw();
});

// Start drag edge on mousedown over node
canvas.addEventListener('mousedown', (e) => {
  const node = getNodeAt(e.offsetX, e.offsetY);
  if (node) {
    draggingEdge = { fromNode: node, toX: e.offsetX, toY: e.offsetY };
  }
});

// Update drag edge line on mousemove
canvas.addEventListener('mousemove', (e) => {
  if (draggingEdge) {
    draggingEdge.toX = e.offsetX;
    draggingEdge.toY = e.offsetY;
    draw();
  }
});

// Finish edge creation on mouseup
canvas.addEventListener('mouseup', (e) => {
  if (!draggingEdge) return;

  const toNode = getNodeAt(e.offsetX, e.offsetY);
  if (toNode && toNode.id !== draggingEdge.fromNode.id) {
    // Avoid duplicate edges (both directions)
    const exists = edges.some(
      (edge) =>
        (edge.from === draggingEdge.fromNode.id && edge.to === toNode.id) ||
        (edge.from === toNode.id && edge.to === draggingEdge.fromNode.id)
    );
    if (!exists) {
      edges.push({
        from: draggingEdge.fromNode.id,
        to: toNode.id,
        weight: getDistance(draggingEdge.fromNode, toNode),
      });
    }
  }
  draggingEdge = null;
  draw();
});

// Select start/end node on click
canvas.addEventListener('dblclick', (e) => {
  const node = getNodeAt(e.offsetX, e.offsetY);
  if (!node) return;

  if (!startNode) {
    startNode = node;
    output.textContent = 'Start node selected: ' + node.id;
  } else if (!endNode && node.id !== startNode.id) {
    endNode = node;
    output.textContent = 'End node selected: ' + node.id;
  } else {
    // Reset if both selected and user double clicks again
    startNode = node;
    endNode = null;
    output.textContent = 'Start node re-selected: ' + node.id;
  }
  draw();
});

// Find shortest path button
findPathBtn.addEventListener('click', () => {
  if (startNode === null || endNode === null) {
    output.textContent = 'Please select start and end nodes by double-clicking nodes.';
    return;
  }
  const result = dijkstra(startNode.id, endNode.id);
  if (result.distance === Infinity) {
    output.textContent = 'No path found between nodes ' + startNode.id + ' and ' + endNode.id;
  } else {
    output.textContent =
      `Shortest distance: ${result.distance}\nPath: ${result.path.join(' → ')}`;
  }
  draw(result.path);
});

// Reset button
resetBtn.addEventListener('click', () => {
  nodes = [];
  edges = [];
  startNode = null;
  endNode = null;
  output.textContent = '';
  draw();
});

// Helpers

function getDistance(a, b) {
  return Math.round(Math.hypot(a.x - b.x, a.y - b.y));
}

function isOverNode(x, y) {
  return nodes.some((node) => Math.hypot(node.x - x, node.y - y) < 15);
}

function getNodeAt(x, y) {
  return nodes.find((node) => Math.hypot(node.x - x, node.y - y) < 15);
}

function draw(path = []) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw edges
  edges.forEach((edge) => {
    const n1 = nodes[edge.from];
    const n2 = nodes[edge.to];
    ctx.beginPath();
    ctx.moveTo(n1.x, n1.y);
    ctx.lineTo(n2.x, n2.y);

    // Highlight edges in path
    if (isEdgeInPath(edge, path)) {
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 4;
    } else {
      ctx.strokeStyle = '#34495e';
      ctx.lineWidth = 2;
    }
    ctx.stroke();

    // Weight text
    ctx.fillStyle = '#2c3e50';
    ctx.font = '14px Arial';
    const midX = (n1.x + n2.x) / 2;
    const midY = (n1.y + n2.y) / 2;
    ctx.fillText(edge.weight, midX + 5, midY - 5);
  });

  // Draw dragging edge if exists
  if (draggingEdge) {
    const n1 = draggingEdge.fromNode;
    ctx.beginPath();
    ctx.moveTo(n1.x, n1.y);
    ctx.lineTo(draggingEdge.toX, draggingEdge.toY);
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw nodes
  nodes.forEach((node) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, 15, 0, Math.PI * 2);

    if (startNode && node.id === startNode.id) {
      ctx.fillStyle = '#2ecc71'; // Green for start
    } else if (endNode && node.id === endNode.id) {
      ctx.fillStyle = '#e74c3c'; // Red for end
    } else {
      ctx.fillStyle = '#3498db'; // Blue default
    }
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#2c3e50';
    ctx.stroke();

    // Node ID text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(node.id, node.x - 5, node.y + 6);
  });
}

function isEdgeInPath(edge, path) {
  for (let i = 0; i < path.length - 1; i++) {
    if (
      (edge.from === path[i] && edge.to === path[i + 1]) ||
      (edge.to === path[i] && edge.from === path[i + 1])
    ) {
      return true;
    }
  }
  return false;
}

// Dijkstra's Algorithm
function dijkstra(start, end) {
  const dist = Array(nodes.length).fill(Infinity);
  const prev = Array(nodes.length).fill(null);
  const visited = Array(nodes.length).fill(false);
  dist[start] = 0;

  for (let i = 0; i < nodes.length; i++) {
    let u = -1;
    for (let j = 0; j < nodes.length; j++) {
      if (!visited[j] && (u === -1 || dist[j] < dist[u])) u = j;
    }
    if (dist[u] === Infinity) break;
    visited[u] = true;

    edges.forEach((e) => {
      if (e.from === u || e.to === u) {
        const v = e.from === u ? e.to : e.from;
        if (dist[u] + e.weight < dist[v]) {
          dist[v] = dist[u] + e.weight;
          prev[v] = u;
        }
      }
    });
  }

  const path = [];
  for (let at = end; at !== null; at = prev[at]) path.push(at);
  path.reverse();

  return { distance: dist[end], path };
}

// Initial draw
draw();
