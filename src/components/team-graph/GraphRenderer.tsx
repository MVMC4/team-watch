import { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';
import { TeamNode, TeamData } from './types';

interface GraphRendererProps {
  nodes: TeamNode[];
  width: number;
  height: number;
  onNodeHover: (team: TeamData | null, screenPos: { x: number; y: number }, nodeIndex?: number) => void;
  onNodeClick: (teamIndex: number) => void;
}

/**
 * GRAPH RENDERER — D3 force-directed graph.
 * Canvas for >300 nodes, SVG for ≤300.
 * Red fill for out-of-range nodes, bookmark stars, click handling.
 */
const GraphRenderer = ({ nodes, width, height, onNodeHover, onNodeClick }: GraphRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<TeamNode, undefined> | null>(null);
  const transformRef = useRef(d3.zoomIdentity);
  const [useCanvas] = useState(() => nodes.length > 300);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const nodesRef = useRef<TeamNode[]>(nodes);
  const hoveredIndexRef = useRef<number>(-1);

  nodesRef.current = nodes;

  const getThemeColors = useCallback(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      bg: style.getPropertyValue('--bg').trim(),
      nodeFill: style.getPropertyValue('--node-fill').trim(),
      nodeStroke: style.getPropertyValue('--node-stroke').trim(),
      nodeLabel: style.getPropertyValue('--node-label').trim(),
      gridLine: style.getPropertyValue('--grid-line').trim(),
      accentInvalid: style.getPropertyValue('--accent-invalid').trim(),
      accentMatch: style.getPropertyValue('--accent-match').trim(),
    };
  }, []);

  /** CANVAS DRAW */
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const colors = getThemeColors();
    const t = transformRef.current;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);

    // Dot grid
    ctx.fillStyle = colors.gridLine;
    const gridSpacing = 24;
    ctx.save();
    ctx.setTransform(t.k, 0, 0, t.k, t.x, t.y);
    const startX = (-t.x / t.k) % gridSpacing;
    const startY = (-t.y / t.k) % gridSpacing;
    for (let gx = -startX; gx < width / t.k + gridSpacing; gx += gridSpacing) {
      for (let gy = -startY; gy < height / t.k + gridSpacing; gy += gridSpacing) {
        ctx.fillRect(gx, gy, 1, 1);
      }
    }

    const currentNodes = nodesRef.current;
    const time = Date.now() / 1000;

    currentNodes.forEach((node) => {
      if (!node.visible && !node.dimmed) return;
      const nx = node.x ?? 0;
      const ny = node.y ?? 0;
      const r = node.dimmed ? node.radius * 0.5 : node.radius;
      const alpha = node.dimmed ? 0.15 : 0.85 + 0.15 * Math.sin(time * 2 + (node.originalIndex ?? 0));

      ctx.globalAlpha = alpha;

      // Validity ring
      const ringR = r + 4;
      if (node.data.isCompany) {
        // Diamond ring
        ctx.beginPath();
        ctx.moveTo(nx, ny - ringR);
        ctx.lineTo(nx + ringR, ny);
        ctx.lineTo(nx, ny + ringR);
        ctx.lineTo(nx - ringR, ny);
        ctx.closePath();
      } else {
        ctx.beginPath();
        ctx.arc(nx, ny, ringR, 0, Math.PI * 2);
      }
      if (node.data.isValid === false) {
        ctx.strokeStyle = colors.accentInvalid;
        ctx.setLineDash([]);
      } else if (node.passesFilter && !node.dimmed) {
        ctx.strokeStyle = colors.accentMatch;
        ctx.setLineDash([]);
      } else if (node.data.isValid === null) {
        ctx.strokeStyle = colors.nodeStroke;
        ctx.setLineDash([3, 4]);
        ctx.globalAlpha = alpha * 0.4;
      } else {
        ctx.strokeStyle = colors.nodeStroke;
        ctx.setLineDash([]);
      }
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = alpha;

      // Main shape — diamond for companies, circle for teams
      ctx.fillStyle = node.isOutOfRange ? colors.accentInvalid : colors.nodeFill;
      if (node.data.isCompany) {
        ctx.beginPath();
        ctx.moveTo(nx, ny - r);
        ctx.lineTo(nx + r, ny);
        ctx.lineTo(nx, ny + r);
        ctx.lineTo(nx - r, ny);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = colors.nodeStroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(nx, ny, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = colors.nodeStroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Bookmark star
      if (node.isBookmarked) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = colors.nodeLabel;
        ctx.font = `${Math.max(10, r * 0.6)}px "IBM Plex Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('★', nx, ny - r - 4);
      }

      // Glow for member search match
      if (node.memberSearchMatch && !node.dimmed) {
        ctx.globalAlpha = 0.3 + 0.2 * Math.sin(time * 4);
        ctx.beginPath();
        ctx.arc(nx, ny, r + 10, 0, Math.PI * 2);
        ctx.strokeStyle = colors.nodeFill;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.globalAlpha = alpha;
      }

      // Label
      ctx.globalAlpha = alpha;
      ctx.fillStyle = colors.nodeLabel;
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      const label = node.data.teamName.length > 14 ? node.data.teamName.substring(0, 14) + '…' : node.data.teamName;
      ctx.fillText(label, nx, ny + r + 14);
    });

    ctx.restore();
    ctx.globalAlpha = 1;
  }, [width, height, getThemeColors]);

  /** Force simulation */
  useEffect(() => {
    if (nodes.length === 0) return;

    const maxMemberCount = Math.max(1, ...nodes.map((n) => n.data.memberCount || 0));
    const maxRadius = 0.4 * Math.min(width, height);

    if (simulationRef.current) simulationRef.current.stop();

    const simulation = d3.forceSimulation<TeamNode>(nodes)
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('charge', d3.forceManyBody().strength(nodes.length === 1 ? 0 : Math.max(-200, -80 * (300 / Math.max(1, nodes.length)))))
      .force('collide', d3.forceCollide<TeamNode>((d) => d.radius + 8))
      .force('radial', d3.forceRadial<TeamNode>(
        (d) => maxRadius * (1 - (d.data.memberCount || 0) / maxMemberCount),
        width / 2, height / 2
      ).strength(0.1));

    simulationRef.current = simulation;

    if (useCanvas) {
      simulation.on('tick', drawCanvas);
    } else {
      simulation.on('tick', () => {
        if (!svgRef.current) return;
        d3.select(svgRef.current)
          .selectAll<SVGGElement, TeamNode>('.node-group')
          .attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
      });
    }

    return () => { simulation.stop(); };
  }, [nodes, width, height, useCanvas, drawCanvas]);

  /** Zoom */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const zoomBehavior = d3.zoom<HTMLDivElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        transformRef.current = event.transform;
        if (useCanvas) drawCanvas();
        else if (svgRef.current) {
          d3.select(svgRef.current).select('.zoom-group').attr('transform', event.transform.toString());
        }
      });

    d3.select(container).call(zoomBehavior);
    return () => { d3.select(container).on('.zoom', null); };
  }, [useCanvas, drawCanvas]);

  /** SVG rendering */
  useEffect(() => {
    if (useCanvas || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    let zoomGroup = svg.select<SVGGElement>('.zoom-group');
    if (zoomGroup.empty()) {
      const defs = svg.append('defs');
      defs.append('pattern')
        .attr('id', 'dot-grid')
        .attr('width', 24).attr('height', 24)
        .attr('patternUnits', 'userSpaceOnUse')
        .append('circle')
        .attr('cx', 12).attr('cy', 12).attr('r', 0.5)
        .attr('fill', 'var(--grid-line)');

      svg.append('rect').attr('width', '100%').attr('height', '100%').attr('fill', 'url(#dot-grid)');
      zoomGroup = svg.append('g').attr('class', 'zoom-group');
    }

    const nodeGroups = zoomGroup.selectAll<SVGGElement, TeamNode>('.node-group')
      .data(nodes, (d) => d.id);

    nodeGroups.exit().remove();

    const enter = nodeGroups.enter()
      .append('g')
      .attr('class', 'node-group')
      .style('will-change', 'transform')
      .style('cursor', 'pointer');

    // Use polygon for companies, circle for teams
    enter.each(function(d) {
      const g = d3.select(this);
      if (d.data.isCompany) {
        g.append('polygon').attr('class', 'validity-ring');
        g.append('polygon').attr('class', 'glow-ring');
        g.append('polygon').attr('class', 'main-shape');
      } else {
        g.append('circle').attr('class', 'validity-ring');
        g.append('circle').attr('class', 'glow-ring');
        g.append('circle').attr('class', 'main-shape');
      }
      g.append('text').attr('class', 'bookmark-star')
        .attr('text-anchor', 'middle')
        .style('font-family', "'IBM Plex Mono', monospace");
      g.append('text').attr('class', 'node-label')
        .attr('text-anchor', 'middle')
        .style('font-family', "'IBM Plex Mono', monospace")
        .style('font-size', '10px')
        .style('fill', 'var(--node-label)');
    });

    const merged = enter.merge(nodeGroups);

    const diamondPoints = (r: number) => `0,${-r} ${r},0 0,${r} ${-r},0`;

    // Validity ring
    merged.each(function(d) {
      const g = d3.select(this);
      const r = (d.dimmed ? d.radius * 0.5 : d.radius) + 4;
      const el = g.select('.validity-ring');
      if (d.data.isCompany) {
        el.attr('points', diamondPoints(r));
      } else {
        el.attr('r', r);
      }
      const strokeColor = d.data.isValid === false
        ? 'var(--accent-invalid)'
        : (d.passesFilter && !d.dimmed)
          ? 'var(--accent-match)'
          : 'var(--node-stroke)';
      el.attr('fill', 'none')
        .attr('stroke', strokeColor)
        .attr('stroke-dasharray', d.data.isValid === null && !d.passesFilter ? '3 4' : 'none')
        .attr('opacity', d.dimmed ? 0.15 : d.data.isValid === null && !d.passesFilter ? 0.4 : 1);
    });

    // Glow ring
    merged.each(function(d) {
      const g = d3.select(this);
      const r = (d.dimmed ? d.radius * 0.5 : d.radius) + 10;
      const el = g.select('.glow-ring');
      if (d.data.isCompany) {
        el.attr('points', diamondPoints(r));
      } else {
        el.attr('r', r);
      }
      el.attr('fill', 'none')
        .attr('stroke', d.memberSearchMatch && !d.dimmed ? 'var(--node-fill)' : 'none')
        .attr('stroke-width', 3)
        .attr('opacity', 0.4)
        .style('animation', d.memberSearchMatch && !d.dimmed ? 'node-pulse 1s ease-in-out infinite' : 'none');
    });

    // Main shape
    merged.each(function(d, i) {
      const g = d3.select(this);
      const r = d.dimmed ? d.radius * 0.5 : d.radius;
      const el = g.select('.main-shape');
      if (d.data.isCompany) {
        el.attr('points', diamondPoints(r));
      } else {
        el.attr('r', r);
      }
      el.attr('fill', d.isOutOfRange ? 'var(--accent-invalid)' : 'var(--node-fill)')
        .attr('stroke', 'var(--node-stroke)')
        .attr('stroke-width', 1.5)
        .attr('opacity', d.dimmed ? 0.15 : 1)
        .style('animation', `node-pulse 3s ease-in-out ${i * 0.1}s infinite`);
    });

    merged.select('.bookmark-star')
      .attr('dy', (d) => -(d.dimmed ? d.radius * 0.5 : d.radius) - 6)
      .attr('opacity', (d) => d.isBookmarked ? 1 : 0)
      .style('font-size', (d) => `${Math.max(10, d.radius * 0.6)}px`)
      .style('fill', 'var(--node-label)')
      .text('★');

    merged.select('.node-label')
      .attr('dy', (d) => (d.dimmed ? d.radius * 0.5 : d.radius) + 14)
      .attr('opacity', (d) => d.dimmed ? 0.15 : 1)
      .text((d) => d.data.teamName.length > 14 ? d.data.teamName.substring(0, 14) + '…' : d.data.teamName);

    // Hover on main shape only (not label)
    merged.select('.main-shape')
      .on('mouseenter', function (event, d) {
        onNodeHover(d.data, { x: event.clientX, y: event.clientY }, d.originalIndex);
      })
      .on('mouseleave', () => {
        onNodeHover(null, { x: 0, y: 0 });
      });

    // Click on entire group
    merged.on('click', (_, d) => {
      onNodeClick(d.originalIndex);
    });
  }, [nodes, useCanvas, onNodeHover, onNodeClick]);

  /** Canvas hit detection */
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!useCanvas) return;
    const t = transformRef.current;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mx = (e.clientX - rect.left - t.x) / t.k;
    const my = (e.clientY - rect.top - t.y) / t.k;

    let closestNode: TeamNode | null = null;
    let minDist = Infinity;

    nodesRef.current.forEach((node) => {
      if (!node.visible && !node.dimmed) return;
      const dx = (node.x ?? 0) - mx;
      const dy = (node.y ?? 0) - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < node.radius + 4 && dist < minDist) {
        minDist = dist;
        closestNode = node;
      }
    });

    const newIndex = closestNode ? (closestNode as TeamNode).originalIndex : -1;
    if (newIndex !== hoveredIndexRef.current) {
      hoveredIndexRef.current = newIndex;
      if (closestNode) {
        onNodeHover((closestNode as TeamNode).data, { x: e.clientX, y: e.clientY }, newIndex);
      } else {
        onNodeHover(null, { x: 0, y: 0 });
      }
    }
  }, [useCanvas, onNodeHover]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!useCanvas) return;
    const t = transformRef.current;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mx = (e.clientX - rect.left - t.x) / t.k;
    const my = (e.clientY - rect.top - t.y) / t.k;

    for (const node of nodesRef.current) {
      if (!node.visible && !node.dimmed) continue;
      const dx = (node.x ?? 0) - mx;
      const dy = (node.y ?? 0) - my;
      if (Math.sqrt(dx * dx + dy * dy) < node.radius + 4) {
        onNodeClick(node.originalIndex);
        return;
      }
    }
  }, [useCanvas, onNodeClick]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleCanvasMouseMove}
      onClick={handleCanvasClick}
      style={{ width, height, position: 'relative', background: 'var(--bg)', overflow: 'hidden' }}
    >
      {useCanvas ? (
        <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />
      ) : (
        <svg ref={svgRef} width={width} height={height} style={{ display: 'block', background: 'var(--bg)' }} />
      )}
    </div>
  );
};

export default GraphRenderer;
