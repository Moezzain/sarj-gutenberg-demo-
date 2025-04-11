"use client";

import React, { useMemo, useCallback, useRef, useEffect, useState, MutableRefObject } from 'react';
import dynamic from 'next/dynamic';
import type { ForceGraphMethods, NodeObject, LinkObject } from 'react-force-graph-2d';

// Dynamically import ForceGraph2D with ssr disabled
const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d'),
  { ssr: false }
);

type Character = {
  name: string;
  description: string;
};

type Interaction = {
  source: string;
  target: string;
  description: string;
  strength: number;
};

type CharacterGraphProps = {
  characters: Character[];
  interactions: Interaction[];
  locale: string;
};

// Define types for the graph nodes and links
type GraphNode = NodeObject & {
  id: string;
  name: string;
  description: string;
  degrees: number;
  val: number;
  __r?: number;
};

type GraphLink = LinkObject & {
  source: string;
  target: string;
  description: string;
  value: number;
  distance: number;
};

type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
};

const CharacterGraph: React.FC<CharacterGraphProps> = ({ characters, interactions, locale }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef(undefined) as MutableRefObject<ForceGraphMethods<NodeObject, LinkObject> | undefined>;
  const [dimensions, setDimensions] = useState({ width: 0, height: 600 });
  const [initialized, setInitialized] = useState(false);
  
  // Direction-aware rendering based on locale
  const isRTL = locale === 'ar';
  
  // Transform the data into format required by ForceGraph
  const graphData = useMemo<GraphData>(() => {
    // Count interactions per character for sizing
    const interactionCounts: Record<string, number> = {};
    interactions.forEach(int => {
      interactionCounts[int.source] = (interactionCounts[int.source] || 0) + 1;
      interactionCounts[int.target] = (interactionCounts[int.target] || 0) + 1;
    });
    
    // Create nodes from characters with fixed positions in a circular layout
    const nodeCount = characters.length;
    const radius = 500; // Large radius for the circle
    const nodes = characters.map((char, index) => {
      // Calculate position on a circle
      const angle = (index / nodeCount) * 2 * Math.PI;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      
      return {
        id: char.name,
        name: char.name,
        description: char.description,
        degrees: 11,
        val: Math.max(3, interactionCounts[char.name] || 1) * 5, // Bigger nodes based on interactions
        fx: x, // Fixed x position
        fy: y  // Fixed y position
      };
    });
    
    // Create links from interactions with increased distance
    const links = interactions.map(int => ({
      source: int.source,
      target: int.target,
      description: int.description,
      value: int.strength,
      distance: 400 // Set explicit distance for each link
    }));

    return { nodes, links };
  }, [characters, interactions]);
  
  // Apply force parameters whenever graph data changes
  useEffect(() => {
    const graph = graphRef.current;
    if (graph) {
      // Disable the link force since we're using fixed positions
      const linkForce = graph.d3Force('link');
      if (linkForce) {
        linkForce.distance(0); // Set to 0 to disable
      }
      
      // Disable the charge force since we're using fixed positions
      const chargeForce = graph.d3Force('charge');
      if (chargeForce) {
        chargeForce.strength(0); // Set to 0 to disable
      }
      
      // Keep a small center force to ensure everything stays centered
      const centerForce = graph.d3Force('center');
      if (centerForce) {
        centerForce.strength(0.1);
      }
      
      // Disable collision force since we're using fixed positions
      const collisionForce = graph.d3Force('collide');
      if (collisionForce) {
        collisionForce.radius(0); // Set to 0 to disable
      }
    }
  }, [graphData]);
  
  // Manually handle graph forces to better space out nodes
  const handleEngineStop = useCallback(() => {
    console.log('Graph rendering complete');
    
    // Only do this once after initial render
    if (!initialized && graphRef.current) {
      setInitialized(true);
      
      // Ensure we can see all nodes
      graphRef.current.zoomToFit(400, 100);
    }
  }, [initialized]);
  
  // Remove the separate useEffect for setting link distance since we'll do it in handleEngineStop
  useEffect(() => {
    if (containerRef.current) {
      const updateDimensions = () => {
        const width = containerRef.current?.clientWidth || 0;
        setDimensions({ width, height: 600 });
      };
      
      // Set initial dimensions
      updateDimensions();
      
      // Update dimensions on resize
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, []);
  
  // Reset initialized state when data changes
  useEffect(() => {
    setInitialized(false);
  }, [characters, interactions]);
  
  if (!graphData.nodes.length) {
    return (
      <div className="flex items-center justify-center h-[300px] w-full bg-gray-50 rounded-md">
        <p className="text-gray-500">No character relationships to display</p>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef} 
      className="character-graph-container relative overflow-hidden w-full rounded-md"
      style={{ height: '600px' }}
    >
      {typeof window !== 'undefined' && dimensions.width > 0 && (
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel={(node) => `${node.name}: ${node.description}`}
          nodeColor={() => isRTL ? '#2a5c8f' : '#3a7ca5'}
          nodeRelSize={1}
          d3AlphaDecay={0.01} // Slower layout convergence for better spacing
          d3VelocityDecay={0.08} // Less friction for node separation
          dagMode={undefined} // Disable any directed acyclic graph mode
          dagLevelDistance={300}
          nodeCanvasObject={(node, ctx, globalScale) => {
            if (node.x === undefined || node.y === undefined) return;
            
            // Draw circle for node
            const label = node.name;
            const fontSize = 14 / (globalScale * 1.2);
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            
            // Calculate radius based on text width plus padding
            const textRadius = textWidth / 2 + (8/globalScale);
            const defaultRadius = Math.max(5, (node.val || 3)) / globalScale;
            // Use the larger of text-based or interaction-based radius
            const radius = Math.max(textRadius, defaultRadius);
            
            // Draw node circle
            ctx.fillStyle = isRTL ? '#2a5c8f' : '#3a7ca5';
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw text
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, node.x, node.y);
            if (globalScale >= 3.5) {
                ctx.fillText(label, node.x, node.y + 2.5);
              }
            // Update node's collision radius
            node.__r = radius * 1.5; // Make collision radius larger than visual radius
          }}
          enableNodeDrag={false}
          linkLabel={(link) => link.description}
          linkWidth={(link) => (link.value / 10) * 3} // Scale width by relationship strength
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={(link) => link.value / 5}
          linkColor={() => isRTL ? '#83A1C0' : '#6089B0'}
          backgroundColor="#f8fafc"
          cooldownTicks={100}
          onEngineStop={handleEngineStop}  
        />
      )}
    </div>
  );
};

export default CharacterGraph;
