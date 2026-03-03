/**
 * FigUML Custom Diagram Engine
 * Pure SVG renderers for: Class, Sequence, Activity, Use Case, ER, DFD
 * No external API dependency — all rendering happens client-side.
 */

// ============================================================================
// SHARED UTILITIES
// ============================================================================

const COLORS = {
    primary: '#6366f1',
    primaryLight: '#e0e1ff',
    accent: '#06b6d4',
    accentLight: '#cffafe',
    green: '#10b981',
    greenLight: '#d1fae5',
    orange: '#f59e0b',
    orangeLight: '#fef3c7',
    pink: '#ec4899',
    pinkLight: '#fce7f3',
    red: '#ef4444',
    bg: '#ffffff',
    text: '#1e293b',
    textLight: '#64748b',
    border: '#cbd5e1',
    line: '#475569',
};

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function measureText(text, fontSize = 14) {
    return text.length * fontSize * 0.58;
}

function wrapSvg(content, width, height) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="font-family: 'Inter', -apple-system, sans-serif;">
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="${COLORS.line}" />
    </marker>
    <marker id="arrowhead-open" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
      <polyline points="0 0, 10 3.5, 0 7" fill="none" stroke="${COLORS.line}" stroke-width="1.5" />
    </marker>
    <marker id="diamond" markerWidth="12" markerHeight="8" refX="12" refY="4" orient="auto">
      <polygon points="0 4, 6 0, 12 4, 6 8" fill="${COLORS.line}" />
    </marker>
    <marker id="diamond-open" markerWidth="12" markerHeight="8" refX="12" refY="4" orient="auto">
      <polygon points="0 4, 6 0, 12 4, 6 8" fill="${COLORS.bg}" stroke="${COLORS.line}" stroke-width="1" />
    </marker>
  </defs>
  ${content}
</svg>`;
}

// ============================================================================
// CLASS DIAGRAM RENDERER
// ============================================================================

function parseClassDiagram(code) {
    const classes = [];
    const relations = [];
    const lines = code.split('\n').map(l => l.trim()).filter(l => l);

    let currentClass = null;
    let section = 'attributes'; // 'attributes' or 'methods'

    for (const line of lines) {
        // Relation: ClassName -- ClassName or ClassName --> ClassName
        const relMatch = line.match(/^(\w+)\s*(--|->|<>--|<>->|\.\.|\.>|<\|--|<\|\.\.)\s*(\w+)(?:\s*:\s*(.+))?$/);
        if (relMatch) {
            relations.push({ from: relMatch[1], to: relMatch[3], type: relMatch[2], label: relMatch[4] || '' });
            continue;
        }

        // Class header: class ClassName { or class ClassName
        const classMatch = line.match(/^class\s+(\w+)\s*\{?\s*$/);
        if (classMatch) {
            currentClass = { name: classMatch[1], attributes: [], methods: [] };
            classes.push(currentClass);
            section = 'attributes';
            continue;
        }

        // End of class
        if (line === '}') {
            currentClass = null;
            continue;
        }

        // Separator ---
        if (line === '---' && currentClass) {
            section = 'methods';
            continue;
        }

        // Attributes/methods within a class
        if (currentClass && line) {
            if (line.includes('(') || section === 'methods') {
                currentClass.methods.push(line);
                section = 'methods';
            } else {
                currentClass.attributes.push(line);
            }
        }
    }

    return { classes, relations };
}

function renderClassDiagram(code) {
    const { classes, relations } = parseClassDiagram(code);
    if (classes.length === 0) return null;

    const BOX_MIN_W = 200;
    const HEADER_H = 40;
    const LINE_H = 24;
    const PAD = 16;
    const GAP = 60;

    // Calculate box sizes
    const boxes = classes.map((cls, i) => {
        const attrCount = cls.attributes.length || 0;
        const methCount = cls.methods.length || 0;
        const totalLines = attrCount + methCount;
        const headerWidth = measureText(cls.name, 16) + PAD * 2;
        const maxAttrWidth = cls.attributes.reduce((max, a) => Math.max(max, measureText(a, 13) + PAD * 2), 0);
        const maxMethWidth = cls.methods.reduce((max, m) => Math.max(max, measureText(m, 13) + PAD * 2), 0);
        const w = Math.max(BOX_MIN_W, headerWidth, maxAttrWidth, maxMethWidth);
        const attrSectionH = attrCount > 0 ? attrCount * LINE_H + 12 : 20;
        const methSectionH = methCount > 0 ? methCount * LINE_H + 12 : 20;
        const h = HEADER_H + attrSectionH + methSectionH;
        return { ...cls, w, h, attrSectionH, methSectionH, idx: i };
    });

    // Layout: grid
    const cols = Math.min(boxes.length, 3);
    const rows = Math.ceil(boxes.length / cols);
    const colWidths = [];
    for (let c = 0; c < cols; c++) {
        let maxW = 0;
        for (let r = 0; r < rows; r++) {
            const idx = r * cols + c;
            if (idx < boxes.length) maxW = Math.max(maxW, boxes[idx].w);
        }
        colWidths.push(maxW);
    }

    const margin = 40;
    let totalW = margin * 2;
    for (const cw of colWidths) totalW += cw + GAP;
    totalW -= GAP;

    const rowHeights = [];
    for (let r = 0; r < rows; r++) {
        let maxH = 0;
        for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            if (idx < boxes.length) maxH = Math.max(maxH, boxes[idx].h);
        }
        rowHeights.push(maxH);
    }

    let totalH = margin * 2;
    for (const rh of rowHeights) totalH += rh + GAP;
    totalH -= GAP;

    // Assign positions
    boxes.forEach((box, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        let x = margin;
        for (let cc = 0; cc < c; cc++) x += colWidths[cc] + GAP;
        let y = margin;
        for (let rr = 0; rr < r; rr++) y += rowHeights[rr] + GAP;
        box.x = x;
        box.y = y;
    });

    let svg = '';

    // Draw relations
    const classMap = {};
    boxes.forEach(b => { classMap[b.name] = b; });

    for (const rel of relations) {
        const from = classMap[rel.from];
        const to = classMap[rel.to];
        if (!from || !to) continue;

        const fx = from.x + from.w / 2;
        const fy = from.y + from.h / 2;
        const tx = to.x + to.w / 2;
        const ty = to.y + to.h / 2;

        let marker = 'url(#arrowhead)';
        let dash = '';
        if (rel.type === '--') { marker = ''; }
        if (rel.type === '..' || rel.type === '.>') { dash = 'stroke-dasharray="6,4"'; }
        if (rel.type === '<|--' || rel.type === '<|..') { marker = 'url(#arrowhead-open)'; }
        if (rel.type.startsWith('<>')) { marker = 'url(#diamond)'; }

        svg += `<line x1="${fx}" y1="${fy}" x2="${tx}" y2="${ty}" stroke="${COLORS.border}" stroke-width="1.5" ${dash} marker-end="${marker}" />`;
        if (rel.label) {
            const mx = (fx + tx) / 2;
            const my = (fy + ty) / 2;
            svg += `<text x="${mx}" y="${my - 6}" text-anchor="middle" font-size="11" fill="${COLORS.textLight}">${escapeHtml(rel.label)}</text>`;
        }
    }

    // Draw class boxes
    for (const box of boxes) {
        const { x, y, w, h, name, attributes, methods, attrSectionH, methSectionH } = box;

        // Shadow
        svg += `<rect x="${x + 2}" y="${y + 2}" width="${w}" height="${h}" rx="8" fill="rgba(0,0,0,0.06)" />`;
        // Box
        svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${COLORS.bg}" stroke="${COLORS.primary}" stroke-width="2" />`;
        // Header
        svg += `<rect x="${x}" y="${y}" width="${w}" height="${HEADER_H}" rx="8" fill="${COLORS.primary}" />`;
        svg += `<rect x="${x}" y="${y + HEADER_H - 8}" width="${w}" height="8" fill="${COLORS.primary}" />`;
        svg += `<text x="${x + w / 2}" y="${y + 26}" text-anchor="middle" font-size="15" font-weight="700" fill="white">${escapeHtml(name)}</text>`;

        // Attributes
        let cy = y + HEADER_H + 12;
        for (const attr of attributes) {
            svg += `<text x="${x + PAD}" y="${cy + 14}" font-size="13" fill="${COLORS.text}">${escapeHtml(attr)}</text>`;
            cy += LINE_H;
        }

        // Divider
        const divY = y + HEADER_H + attrSectionH;
        svg += `<line x1="${x + 8}" y1="${divY}" x2="${x + w - 8}" y2="${divY}" stroke="${COLORS.border}" stroke-width="1" />`;

        // Methods
        cy = divY + 12;
        for (const meth of methods) {
            svg += `<text x="${x + PAD}" y="${cy + 14}" font-size="13" fill="${COLORS.primary}" font-style="italic">${escapeHtml(meth)}</text>`;
            cy += LINE_H;
        }
    }

    return wrapSvg(svg, totalW, totalH);
}

// ============================================================================
// SEQUENCE DIAGRAM RENDERER
// ============================================================================

function parseSequenceDiagram(code) {
    const participants = [];
    const messages = [];
    const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

    for (const line of lines) {
        const partMatch = line.match(/^participant\s+(.+)$/i);
        if (partMatch) {
            const name = partMatch[1].replace(/"/g, '').trim();
            if (!participants.includes(name)) participants.push(name);
            continue;
        }

        // Message: A -> B: text  or A --> B: text  or A ->> B: text
        const msgMatch = line.match(/^(.+?)\s*(->|-->|->>|-->>)\s*(.+?):\s*(.+)$/);
        if (msgMatch) {
            const from = msgMatch[1].trim();
            const to = msgMatch[3].trim();
            if (!participants.includes(from)) participants.push(from);
            if (!participants.includes(to)) participants.push(to);
            messages.push({
                from, to,
                type: msgMatch[2],
                text: msgMatch[4].trim()
            });
            continue;
        }

        // note over A: text
        const noteMatch = line.match(/^note\s+(?:over\s+)?(.+?):\s*(.+)$/i);
        if (noteMatch) {
            messages.push({ type: 'note', over: noteMatch[1].trim(), text: noteMatch[2].trim() });
        }
    }

    return { participants, messages };
}

function renderSequenceDiagram(code) {
    const { participants, messages } = parseSequenceDiagram(code);
    if (participants.length === 0) return null;

    const P_WIDTH = 120;
    const P_HEIGHT = 40;
    const GAP = 160;
    const MSG_GAP = 50;
    const PAD = 40;

    const pPositions = {};
    participants.forEach((p, i) => {
        pPositions[p] = PAD + i * GAP + GAP / 2;
    });

    const totalW = PAD * 2 + participants.length * GAP;
    const totalH = P_HEIGHT + PAD * 2 + messages.length * MSG_GAP + PAD + P_HEIGHT + 20;

    let svg = '';
    const headerY = PAD;
    const startLifeline = headerY + P_HEIGHT;
    const endLifeline = totalH - PAD - P_HEIGHT;

    // Draw lifelines
    for (const p of participants) {
        const x = pPositions[p];
        // Dashed lifeline
        svg += `<line x1="${x}" y1="${startLifeline}" x2="${x}" y2="${endLifeline}" stroke="${COLORS.border}" stroke-width="1.5" stroke-dasharray="6,4" />`;

        // Top box
        const bx = x - P_WIDTH / 2;
        svg += `<rect x="${bx}" y="${headerY}" width="${P_WIDTH}" height="${P_HEIGHT}" rx="8" fill="${COLORS.primary}" />`;
        svg += `<text x="${x}" y="${headerY + 25}" text-anchor="middle" font-size="13" font-weight="600" fill="white">${escapeHtml(p)}</text>`;

        // Bottom box
        svg += `<rect x="${bx}" y="${endLifeline}" width="${P_WIDTH}" height="${P_HEIGHT}" rx="8" fill="${COLORS.primary}" />`;
        svg += `<text x="${x}" y="${endLifeline + 25}" text-anchor="middle" font-size="13" font-weight="600" fill="white">${escapeHtml(p)}</text>`;
    }

    // Draw messages
    let msgY = startLifeline + 30;
    for (const msg of messages) {
        if (msg.type === 'note') {
            const overX = pPositions[msg.over] || totalW / 2;
            const noteW = measureText(msg.text, 12) + 20;
            svg += `<rect x="${overX - noteW / 2}" y="${msgY - 15}" width="${noteW}" height="28" rx="4" fill="${COLORS.orangeLight}" stroke="${COLORS.orange}" stroke-width="1" />`;
            svg += `<text x="${overX}" y="${msgY + 3}" text-anchor="middle" font-size="12" fill="${COLORS.text}">${escapeHtml(msg.text)}</text>`;
            msgY += MSG_GAP;
            continue;
        }

        const fromX = pPositions[msg.from];
        const toX = pPositions[msg.to];
        if (fromX === undefined || toX === undefined) continue;

        const isSelf = msg.from === msg.to;
        const isDashed = msg.type === '-->' || msg.type === '-->>';

        if (isSelf) {
            const cx = fromX;
            const loopW = 40;
            svg += `<path d="M ${cx} ${msgY} L ${cx + loopW} ${msgY} L ${cx + loopW} ${msgY + 25} L ${cx + 5} ${msgY + 25}" fill="none" stroke="${COLORS.line}" stroke-width="1.5" ${isDashed ? 'stroke-dasharray="6,4"' : ''} marker-end="url(#arrowhead)" />`;
            svg += `<text x="${cx + loopW + 6}" y="${msgY + 14}" font-size="12" fill="${COLORS.text}">${escapeHtml(msg.text)}</text>`;
        } else {
            svg += `<line x1="${fromX}" y1="${msgY}" x2="${toX}" y2="${msgY}" stroke="${COLORS.line}" stroke-width="1.5" ${isDashed ? 'stroke-dasharray="6,4"' : ''} marker-end="url(#arrowhead)" />`;
            const mx = (fromX + toX) / 2;
            svg += `<text x="${mx}" y="${msgY - 8}" text-anchor="middle" font-size="12" fill="${COLORS.text}">${escapeHtml(msg.text)}</text>`;
        }
        msgY += MSG_GAP;
    }

    return wrapSvg(svg, totalW, totalH);
}

// ============================================================================
// ACTIVITY DIAGRAM RENDERER
// ============================================================================

function parseActivityDiagram(code) {
    const nodes = [];
    const edges = [];
    const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

    let id = 0;
    const nodeMap = {};

    function getOrCreateNode(name, type = 'action') {
        const key = name.toLowerCase();
        if (nodeMap[key]) return nodeMap[key];
        const node = { id: id++, name, type };
        nodes.push(node);
        nodeMap[key] = node;
        return node;
    }

    for (const line of lines) {
        // start / end
        if (line.match(/^\(start\)$/i)) { getOrCreateNode('Start', 'start'); continue; }
        if (line.match(/^\(end\)$/i)) { getOrCreateNode('End', 'end'); continue; }

        // decision: <condition>
        const decMatch = line.match(/^<(.+)>$/);
        if (decMatch) { getOrCreateNode(decMatch[1], 'decision'); continue; }

        // edge: A -> B or A -> B: label
        const edgeMatch = line.match(/^(.+?)\s*->\s*(.+?)(?:\s*:\s*(.+))?$/);
        if (edgeMatch) {
            let fromName = edgeMatch[1].trim();
            let toName = edgeMatch[2].trim();
            const label = edgeMatch[3]?.trim() || '';

            let fromType = 'action';
            let toType = 'action';
            if (fromName.match(/^\(start\)$/i)) { fromName = 'Start'; fromType = 'start'; }
            if (fromName.match(/^\(end\)$/i)) { fromName = 'End'; fromType = 'end'; }
            if (toName.match(/^\(start\)$/i)) { toName = 'Start'; toType = 'start'; }
            if (toName.match(/^\(end\)$/i)) { toName = 'End'; toType = 'end'; }
            if (fromName.startsWith('<') && fromName.endsWith('>')) { fromName = fromName.slice(1, -1); fromType = 'decision'; }
            if (toName.startsWith('<') && toName.endsWith('>')) { toName = toName.slice(1, -1); toType = 'decision'; }

            const from = getOrCreateNode(fromName, fromType);
            const to = getOrCreateNode(toName, toType);
            edges.push({ from: from.id, to: to.id, label });
        }
    }

    return { nodes, edges };
}

function renderActivityDiagram(code) {
    const { nodes, edges } = parseActivityDiagram(code);
    if (nodes.length === 0) return null;

    const NODE_W = 160;
    const NODE_H = 40;
    const DIAMOND = 40;
    const V_GAP = 70;
    const H_GAP = 200;
    const PAD = 50;

    // Simple topological layout
    const levels = {};
    const visited = new Set();
    const adj = {};
    edges.forEach(e => {
        if (!adj[e.from]) adj[e.from] = [];
        adj[e.from].push(e.to);
    });

    function assignLevel(nodeId, level) {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        levels[nodeId] = Math.max(levels[nodeId] || 0, level);
        (adj[nodeId] || []).forEach(child => assignLevel(child, level + 1));
    }

    // Start from nodes with no incoming edges
    const hasIncoming = new Set(edges.map(e => e.to));
    nodes.forEach(n => {
        if (!hasIncoming.has(n.id)) assignLevel(n.id, 0);
    });
    // Assign remaining
    nodes.forEach(n => {
        if (!visited.has(n.id)) assignLevel(n.id, Object.keys(levels).length);
    });

    // Group by level
    const levelGroups = {};
    nodes.forEach(n => {
        const lvl = levels[n.id] || 0;
        if (!levelGroups[lvl]) levelGroups[lvl] = [];
        levelGroups[lvl].push(n);
    });

    const maxLevel = Math.max(...Object.keys(levelGroups).map(Number));
    const maxNodesInLevel = Math.max(...Object.values(levelGroups).map(g => g.length));

    const totalW = maxNodesInLevel * H_GAP + PAD * 2;
    const totalH = (maxLevel + 1) * V_GAP + PAD * 2 + NODE_H;

    // Assign positions
    const positions = {};
    for (let lvl = 0; lvl <= maxLevel; lvl++) {
        const group = levelGroups[lvl] || [];
        const startX = (totalW - group.length * H_GAP) / 2 + H_GAP / 2;
        group.forEach((n, i) => {
            positions[n.id] = {
                x: startX + i * H_GAP,
                y: PAD + lvl * V_GAP + NODE_H / 2
            };
        });
    }

    let svg = '';

    // Draw edges
    for (const edge of edges) {
        const from = positions[edge.from];
        const to = positions[edge.to];
        if (!from || !to) continue;

        if (from.x === to.x) {
            svg += `<line x1="${from.x}" y1="${from.y + NODE_H / 2}" x2="${to.x}" y2="${to.y - NODE_H / 2}" stroke="${COLORS.line}" stroke-width="1.5" marker-end="url(#arrowhead)" />`;
        } else {
            const midY = (from.y + NODE_H / 2 + to.y - NODE_H / 2) / 2;
            svg += `<path d="M ${from.x} ${from.y + NODE_H / 2} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${to.y - NODE_H / 2}" fill="none" stroke="${COLORS.line}" stroke-width="1.5" marker-end="url(#arrowhead)" />`;
        }
        if (edge.label) {
            const mx = (from.x + to.x) / 2;
            const my = (from.y + to.y) / 2;
            svg += `<text x="${mx + 6}" y="${my}" font-size="11" fill="${COLORS.textLight}">${escapeHtml(edge.label)}</text>`;
        }
    }

    // Draw nodes
    for (const node of nodes) {
        const pos = positions[node.id];
        if (!pos) continue;
        const { x, y } = pos;

        if (node.type === 'start') {
            svg += `<circle cx="${x}" cy="${y}" r="16" fill="${COLORS.text}" />`;
        } else if (node.type === 'end') {
            svg += `<circle cx="${x}" cy="${y}" r="16" fill="none" stroke="${COLORS.text}" stroke-width="3" />`;
            svg += `<circle cx="${x}" cy="${y}" r="10" fill="${COLORS.text}" />`;
        } else if (node.type === 'decision') {
            svg += `<polygon points="${x},${y - DIAMOND / 2} ${x + DIAMOND / 2},${y} ${x},${y + DIAMOND / 2} ${x - DIAMOND / 2},${y}" fill="${COLORS.orangeLight}" stroke="${COLORS.orange}" stroke-width="2" />`;
            svg += `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" font-weight="600" fill="${COLORS.text}">${escapeHtml(node.name)}</text>`;
        } else {
            const w = Math.max(NODE_W, measureText(node.name, 14) + 32);
            svg += `<rect x="${x - w / 2}" y="${y - NODE_H / 2}" width="${w}" height="${NODE_H}" rx="20" fill="${COLORS.primaryLight}" stroke="${COLORS.primary}" stroke-width="2" />`;
            svg += `<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="13" font-weight="500" fill="${COLORS.text}">${escapeHtml(node.name)}</text>`;
        }
    }

    return wrapSvg(svg, totalW, totalH);
}

// ============================================================================
// USE CASE DIAGRAM RENDERER
// ============================================================================

function parseUseCaseDiagram(code) {
    const actors = [];
    const usecases = [];
    const relations = [];
    const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

    for (const line of lines) {
        const actorMatch = line.match(/^actor\s+(.+)$/i);
        if (actorMatch) { actors.push(actorMatch[1].replace(/"/g, '').trim()); continue; }

        const ucMatch = line.match(/^usecase\s+(.+)$/i);
        if (ucMatch) { usecases.push(ucMatch[1].replace(/"/g, '').trim()); continue; }

        const relMatch = line.match(/^(.+?)\s*(-->|--|->)\s*(.+?)(?:\s*:\s*(.+))?$/);
        if (relMatch) {
            const from = relMatch[1].replace(/"/g, '').trim();
            const to = relMatch[3].replace(/"/g, '').trim();
            if (!actors.includes(from) && !usecases.includes(from)) {
                if (line.toLowerCase().includes('actor') || from.match(/^[A-Z][a-z]+$/)) {
                    actors.push(from);
                } else {
                    usecases.push(from);
                }
            }
            if (!actors.includes(to) && !usecases.includes(to)) {
                usecases.push(to);
            }
            relations.push({ from, to, label: relMatch[4]?.trim() || '', type: relMatch[2] });
        }
    }

    return { actors: [...new Set(actors)], usecases: [...new Set(usecases)], relations };
}

function renderUseCaseDiagram(code) {
    const { actors, usecases, relations } = parseUseCaseDiagram(code);
    if (actors.length === 0 && usecases.length === 0) return null;

    const UC_W = 160;
    const UC_H = 50;
    const ACTOR_H = 80;
    const PAD = 60;
    const GAP_V = 80;
    const ACTOR_AREA = 120;

    const halfActors = Math.ceil(actors.length / 2);
    const ucCount = Math.max(usecases.length, 1);

    const totalH = PAD * 2 + Math.max(actors.length, ucCount) * GAP_V;
    const totalW = ACTOR_AREA + UC_W + PAD * 3 + ACTOR_AREA;

    const positions = {};

    // Left actors
    for (let i = 0; i < halfActors; i++) {
        positions[actors[i]] = {
            x: PAD + ACTOR_AREA / 2,
            y: PAD + i * GAP_V + GAP_V / 2,
            type: 'actor'
        };
    }

    // Right actors
    for (let i = halfActors; i < actors.length; i++) {
        positions[actors[i]] = {
            x: totalW - PAD - ACTOR_AREA / 2,
            y: PAD + (i - halfActors) * GAP_V + GAP_V / 2,
            type: 'actor'
        };
    }

    // Use cases in center
    const ucStartY = (totalH - ucCount * GAP_V) / 2 + GAP_V / 2;
    usecases.forEach((uc, i) => {
        positions[uc] = {
            x: totalW / 2,
            y: ucStartY + i * GAP_V,
            type: 'usecase'
        };
    });

    let svg = '';

    // System boundary
    const sysX = ACTOR_AREA + PAD;
    const sysW = totalW - 2 * (ACTOR_AREA + PAD);
    svg += `<rect x="${sysX}" y="${PAD / 2}" width="${sysW}" height="${totalH - PAD}" rx="12" fill="none" stroke="${COLORS.border}" stroke-width="2" stroke-dasharray="8,4" />`;
    svg += `<text x="${sysX + sysW / 2}" y="${PAD / 2 + 20}" text-anchor="middle" font-size="14" font-weight="600" fill="${COLORS.textLight}">System</text>`;

    // Draw relations
    for (const rel of relations) {
        const from = positions[rel.from];
        const to = positions[rel.to];
        if (!from || !to) continue;
        svg += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${COLORS.border}" stroke-width="1.5" />`;
        if (rel.label) {
            svg += `<text x="${(from.x + to.x) / 2}" y="${(from.y + to.y) / 2 - 6}" text-anchor="middle" font-size="10" fill="${COLORS.textLight}">${escapeHtml(rel.label)}</text>`;
        }
    }

    // Draw actors (stick figures)
    for (const actor of actors) {
        const pos = positions[actor];
        if (!pos) continue;
        const { x, y } = pos;
        // Head
        svg += `<circle cx="${x}" cy="${y - 24}" r="12" fill="none" stroke="${COLORS.primary}" stroke-width="2" />`;
        // Body
        svg += `<line x1="${x}" y1="${y - 12}" x2="${x}" y2="${y + 10}" stroke="${COLORS.primary}" stroke-width="2" />`;
        // Arms
        svg += `<line x1="${x - 16}" y1="${y - 2}" x2="${x + 16}" y2="${y - 2}" stroke="${COLORS.primary}" stroke-width="2" />`;
        // Legs
        svg += `<line x1="${x}" y1="${y + 10}" x2="${x - 14}" y2="${y + 28}" stroke="${COLORS.primary}" stroke-width="2" />`;
        svg += `<line x1="${x}" y1="${y + 10}" x2="${x + 14}" y2="${y + 28}" stroke="${COLORS.primary}" stroke-width="2" />`;
        // Name
        svg += `<text x="${x}" y="${y + 44}" text-anchor="middle" font-size="12" font-weight="500" fill="${COLORS.text}">${escapeHtml(actor)}</text>`;
    }

    // Draw use cases (ovals)
    for (const uc of usecases) {
        const pos = positions[uc];
        if (!pos) continue;
        const { x, y } = pos;
        const w = Math.max(UC_W, measureText(uc, 13) + 40);
        svg += `<ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${UC_H / 2}" fill="${COLORS.primaryLight}" stroke="${COLORS.primary}" stroke-width="2" />`;
        svg += `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="13" font-weight="500" fill="${COLORS.text}">${escapeHtml(uc)}</text>`;
    }

    return wrapSvg(svg, totalW, totalH);
}

// ============================================================================
// ER DIAGRAM RENDERER
// ============================================================================

function parseERDiagram(code) {
    const entities = [];
    const relations = [];
    const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

    let currentEntity = null;

    for (const line of lines) {
        const entityMatch = line.match(/^entity\s+(.+?)(?:\s*\{)?\s*$/i);
        if (entityMatch) {
            currentEntity = { name: entityMatch[1].replace(/"/g, '').trim(), attributes: [] };
            entities.push(currentEntity);
            continue;
        }

        if (line === '}') { currentEntity = null; continue; }

        if (currentEntity) {
            const attrMatch = line.match(/^([*+\-~]?)\s*(.+?)(?:\s*:\s*(.+))?\s*$/);
            if (attrMatch) {
                const prefix = attrMatch[1];
                const name = attrMatch[2].trim();
                const type = attrMatch[3]?.trim() || '';
                currentEntity.attributes.push({
                    name,
                    type,
                    isPK: prefix === '*',
                    isFK: prefix === '+',
                });
            }
            continue;
        }

        // Relation: Entity1 ||--o{ Entity2 : label  or simpler: Entity1 -- Entity2 : label
        const relMatch = line.match(/^(.+?)\s*([\|o\{}<>]{0,4}--[\|o\{}<>]{0,4}|--)\s*(.+?)(?:\s*:\s*(.+))?$/i);
        if (relMatch) {
            relations.push({
                from: relMatch[1].trim(),
                to: relMatch[3].trim(),
                cardinality: relMatch[2],
                label: relMatch[4]?.trim() || ''
            });
        }
    }

    return { entities, relations };
}

function renderERDiagram(code) {
    const { entities, relations } = parseERDiagram(code);
    if (entities.length === 0) return null;

    const PAD = 40;
    const HEADER_H = 38;
    const ROW_H = 26;
    const MIN_W = 180;
    const GAP = 80;

    const boxes = entities.map(entity => {
        const nameW = measureText(entity.name, 15) + 40;
        const attrW = entity.attributes.reduce((max, a) => {
            const txt = `${a.isPK ? 'PK ' : a.isFK ? 'FK ' : ''}${a.name}${a.type ? ': ' + a.type : ''}`;
            return Math.max(max, measureText(txt, 12) + 40);
        }, 0);
        const w = Math.max(MIN_W, nameW, attrW);
        const h = HEADER_H + entity.attributes.length * ROW_H + 8;
        return { ...entity, w, h };
    });

    const cols = Math.min(boxes.length, 3);
    const rows = Math.ceil(boxes.length / cols);

    const colWidths = [];
    for (let c = 0; c < cols; c++) {
        let maxW = 0;
        for (let r = 0; r < rows; r++) {
            const idx = r * cols + c;
            if (idx < boxes.length) maxW = Math.max(maxW, boxes[idx].w);
        }
        colWidths.push(maxW);
    }

    const rowHeights = [];
    for (let r = 0; r < rows; r++) {
        let maxH = 0;
        for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            if (idx < boxes.length) maxH = Math.max(maxH, boxes[idx].h);
        }
        rowHeights.push(maxH);
    }

    let totalW = PAD * 2;
    for (const cw of colWidths) totalW += cw + GAP;
    totalW -= GAP;

    let totalH = PAD * 2;
    for (const rh of rowHeights) totalH += rh + GAP;
    totalH -= GAP;

    boxes.forEach((box, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        let x = PAD;
        for (let cc = 0; cc < c; cc++) x += colWidths[cc] + GAP;
        let y = PAD;
        for (let rr = 0; rr < r; rr++) y += rowHeights[rr] + GAP;
        box.x = x;
        box.y = y;
    });

    let svg = '';

    // Relations
    const entityMap = {};
    boxes.forEach(b => { entityMap[b.name] = b; });
    for (const rel of relations) {
        const from = entityMap[rel.from];
        const to = entityMap[rel.to];
        if (!from || !to) continue;
        const fx = from.x + from.w / 2;
        const fy = from.y + from.h / 2;
        const tx = to.x + to.w / 2;
        const ty = to.y + to.h / 2;
        svg += `<line x1="${fx}" y1="${fy}" x2="${tx}" y2="${ty}" stroke="${COLORS.border}" stroke-width="2" />`;
        if (rel.label) {
            const mx = (fx + tx) / 2;
            const my = (fy + ty) / 2;
            const rhombW = Math.max(80, measureText(rel.label, 12) + 24);
            svg += `<polygon points="${mx},${my - 20} ${mx + rhombW / 2},${my} ${mx},${my + 20} ${mx - rhombW / 2},${my}" fill="${COLORS.accentLight}" stroke="${COLORS.accent}" stroke-width="1.5" />`;
            svg += `<text x="${mx}" y="${my + 4}" text-anchor="middle" font-size="11" font-weight="500" fill="${COLORS.text}">${escapeHtml(rel.label)}</text>`;
        }
    }

    // Entity boxes
    for (const box of boxes) {
        const { x, y, w, h, name, attributes } = box;
        svg += `<rect x="${x + 2}" y="${y + 2}" width="${w}" height="${h}" rx="6" fill="rgba(0,0,0,0.05)" />`;
        svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${COLORS.bg}" stroke="${COLORS.accent}" stroke-width="2" />`;
        svg += `<rect x="${x}" y="${y}" width="${w}" height="${HEADER_H}" rx="6" fill="${COLORS.accent}" />`;
        svg += `<rect x="${x}" y="${y + HEADER_H - 6}" width="${w}" height="6" fill="${COLORS.accent}" />`;
        svg += `<text x="${x + w / 2}" y="${y + 24}" text-anchor="middle" font-size="14" font-weight="700" fill="white">${escapeHtml(name)}</text>`;

        let ay = y + HEADER_H + 8;
        for (const attr of attributes) {
            const prefix = attr.isPK ? '🔑 ' : attr.isFK ? '🔗 ' : '   ';
            const label = `${prefix}${attr.name}${attr.type ? ' : ' + attr.type : ''}`;
            svg += `<text x="${x + 14}" y="${ay + 16}" font-size="12" fill="${attr.isPK ? COLORS.primary : COLORS.text}" ${attr.isPK ? 'font-weight="600"' : ''}>${escapeHtml(label)}</text>`;
            if (attr.isPK) {
                const tw = measureText(attr.name, 12);
                svg += `<line x1="${x + 32}" y1="${ay + 18}" x2="${x + 32 + tw}" y2="${ay + 18}" stroke="${COLORS.primary}" stroke-width="1" />`;
            }
            ay += ROW_H;
        }
    }

    return wrapSvg(svg, totalW, totalH);
}

// ============================================================================
// DFD RENDERER (Data Flow Diagram)
// ============================================================================

function parseDFD(code) {
    const processes = [];
    const datastores = [];
    const externals = [];
    const flows = [];
    const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

    for (const line of lines) {
        const procMatch = line.match(/^process\s+(.+)$/i);
        if (procMatch) { processes.push(procMatch[1].replace(/"/g, '').trim()); continue; }

        const dsMatch = line.match(/^datastore\s+(.+)$/i);
        if (dsMatch) { datastores.push(dsMatch[1].replace(/"/g, '').trim()); continue; }

        const extMatch = line.match(/^external\s+(.+)$/i);
        if (extMatch) { externals.push(extMatch[1].replace(/"/g, '').trim()); continue; }

        const flowMatch = line.match(/^(.+?)\s*(->|-->)\s*(.+?)(?:\s*:\s*(.+))?$/);
        if (flowMatch) {
            const from = flowMatch[1].replace(/"/g, '').trim();
            const to = flowMatch[3].replace(/"/g, '').trim();
            flows.push({ from, to, label: flowMatch[4]?.trim() || '' });
            // Auto-detect types
            if (!processes.includes(from) && !datastores.includes(from) && !externals.includes(from)) {
                processes.push(from);
            }
            if (!processes.includes(to) && !datastores.includes(to) && !externals.includes(to)) {
                processes.push(to);
            }
        }
    }

    return { processes: [...new Set(processes)], datastores: [...new Set(datastores)], externals: [...new Set(externals)], flows };
}

function renderDFD(code) {
    const { processes, datastores, externals, flows } = parseDFD(code);
    if (processes.length === 0 && datastores.length === 0) return null;

    const PAD = 50;
    const GAP = 120;
    const allItems = [
        ...externals.map(name => ({ name, type: 'external' })),
        ...processes.map(name => ({ name, type: 'process' })),
        ...datastores.map(name => ({ name, type: 'datastore' })),
    ];

    // Grid layout
    const cols = Math.min(allItems.length, 3);
    const rows = Math.ceil(allItems.length / cols);
    const cellW = 180;
    const cellH = 80;

    const totalW = PAD * 2 + cols * (cellW + GAP) - GAP;
    const totalH = PAD * 2 + rows * (cellH + GAP) - GAP;

    const positions = {};
    allItems.forEach((item, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        positions[item.name] = {
            x: PAD + c * (cellW + GAP) + cellW / 2,
            y: PAD + r * (cellH + GAP) + cellH / 2,
            type: item.type
        };
    });

    let svg = '';

    // Draw flows
    for (const flow of flows) {
        const from = positions[flow.from];
        const to = positions[flow.to];
        if (!from || !to) continue;
        svg += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${COLORS.line}" stroke-width="1.5" marker-end="url(#arrowhead)" />`;
        if (flow.label) {
            const mx = (from.x + to.x) / 2;
            const my = (from.y + to.y) / 2;
            const tw = measureText(flow.label, 11) + 12;
            svg += `<rect x="${mx - tw / 2}" y="${my - 18}" width="${tw}" height="20" rx="4" fill="${COLORS.bg}" stroke="${COLORS.border}" stroke-width="1" />`;
            svg += `<text x="${mx}" y="${my - 4}" text-anchor="middle" font-size="11" fill="${COLORS.text}">${escapeHtml(flow.label)}</text>`;
        }
    }

    // Draw nodes
    for (const item of allItems) {
        const pos = positions[item.name];
        const { x, y } = pos;
        const w = Math.max(cellW, measureText(item.name, 13) + 40);

        if (item.type === 'process') {
            svg += `<circle cx="${x}" cy="${y}" r="${cellH / 2}" fill="${COLORS.primaryLight}" stroke="${COLORS.primary}" stroke-width="2" />`;
            svg += `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="13" font-weight="600" fill="${COLORS.text}">${escapeHtml(item.name)}</text>`;
        } else if (item.type === 'datastore') {
            svg += `<rect x="${x - w / 2}" y="${y - 20}" width="${w}" height="40" fill="${COLORS.greenLight}" stroke="${COLORS.green}" stroke-width="2" />`;
            svg += `<line x1="${x - w / 2}" y1="${y - 20}" x2="${x + w / 2}" y2="${y - 20}" stroke="${COLORS.green}" stroke-width="2" />`;
            svg += `<line x1="${x - w / 2}" y1="${y + 20}" x2="${x + w / 2}" y2="${y + 20}" stroke="${COLORS.green}" stroke-width="2" />`;
            svg += `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="13" font-weight="500" fill="${COLORS.text}">${escapeHtml(item.name)}</text>`;
        } else if (item.type === 'external') {
            svg += `<rect x="${x - w / 2}" y="${y - 25}" width="${w}" height="50" rx="4" fill="${COLORS.bg}" stroke="${COLORS.text}" stroke-width="2" />`;
            svg += `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="13" font-weight="600" fill="${COLORS.text}">${escapeHtml(item.name)}</text>`;
        }
    }

    return wrapSvg(svg, totalW, totalH);
}

// ============================================================================
// MAIN RENDER FUNCTION
// ============================================================================

const CUSTOM_RENDERERS = {
    class: renderClassDiagram,
    sequence: renderSequenceDiagram,
    activity: renderActivityDiagram,
    usecase: renderUseCaseDiagram,
    er: renderERDiagram,
    dfd: renderDFD,
};

/**
 * Render a diagram using the custom engine.
 * Returns SVG string or null if parsing fails.
 */
export function renderCustomDiagram(code, diagramType) {
    const renderer = CUSTOM_RENDERERS[diagramType];
    if (!renderer) return null;

    try {
        return renderer(code);
    } catch (err) {
        console.error(`Custom render error (${diagramType}):`, err);
        return null;
    }
}

/**
 * Check if a diagram type has a custom renderer.
 */
export function hasCustomRenderer(diagramType) {
    return diagramType in CUSTOM_RENDERERS;
}

// ============================================================================
// DIAGRAM TYPES CATALOG
// ============================================================================

export const DIAGRAM_TYPES = {
    class: {
        label: 'Class Diagram',
        defaultCode: `class User {
  +name: String
  +email: String
  ---
  +login()
  +logout()
  +getProfile()
}

class Diagram {
  +title: String
  +code: String
  +type: String
  ---
  +render()
  +save()
  +export()
}

class Project {
  +name: String
  +description: String
  ---
  +addDiagram()
  +removeDiagram()
}

User -> Diagram : creates
User -> Project : owns
Project -> Diagram : contains`
    },

    sequence: {
        label: 'Sequence Diagram',
        defaultCode: `participant Client
participant Server
participant Database

Client -> Server: HTTP Request
Server -> Database: Query Data
Database --> Server: Result Set
Server --> Client: JSON Response
Client -> Server: POST /api/save
Server -> Database: Insert Record
Database --> Server: Success
Server --> Client: 201 Created`
    },

    activity: {
        label: 'Activity Diagram',
        defaultCode: `(start) -> Login Page
Login Page -> <Valid Credentials?>
<Valid Credentials?> -> Dashboard : Yes
<Valid Credentials?> -> Error Message : No
Error Message -> Login Page
Dashboard -> Create Diagram
Create Diagram -> Edit Code
Edit Code -> Preview
Preview -> <Satisfied?>
<Satisfied?> -> Export : Yes
<Satisfied?> -> Edit Code : No
Export -> (end)`
    },

    usecase: {
        label: 'Use Case Diagram',
        defaultCode: `actor User
actor Admin

User -> Login
User -> Create Diagram
User -> Edit Diagram
User -> Export Diagram
User -> Share Diagram
Admin -> Manage Users
Admin -> View Analytics`
    },

    er: {
        label: 'ER Diagram',
        defaultCode: `entity User {
  * id : INT
  name : VARCHAR
  email : VARCHAR
  + role_id : INT
}

entity Diagram {
  * id : INT
  title : VARCHAR
  code : TEXT
  type : VARCHAR
  + user_id : INT
}

entity Role {
  * id : INT
  name : VARCHAR
  permissions : JSON
}

User ||--o{ Diagram : creates
Role ||--o{ User : assigns`
    },

    dfd: {
        label: 'Data Flow Diagram',
        defaultCode: `external User
process Authentication
process Diagram Engine
process Export Service
datastore User Database
datastore Diagram Store

User -> Authentication : Login Request
Authentication -> User Database : Verify Credentials
User Database -> Authentication : User Data
Authentication -> User : Auth Token
User -> Diagram Engine : Create Diagram
Diagram Engine -> Diagram Store : Save Diagram
Diagram Store -> Diagram Engine : Diagram Data
Diagram Engine -> User : Rendered Output
User -> Export Service : Export Request
Export Service -> Diagram Store : Fetch Diagram
Export Service -> User : PNG/SVG File`
    },

    graphviz: {
        label: 'Graphviz (DOT)',
        defaultCode: `digraph G {
  rankdir=LR;
  node [shape=box, style="rounded,filled", fillcolor="#e8e8ff"];
  
  Start -> Process -> End;
  Process -> Decision;
  Decision -> "Option A";
  Decision -> "Option B";
}`
    },
};
