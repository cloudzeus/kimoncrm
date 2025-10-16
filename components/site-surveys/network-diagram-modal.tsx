"use client";

import React, { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
  Position,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import '@xyflow/react/dist/style.css';
import { Building2, Server, Network as NetworkIcon, Home, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Building {
  name: string;
  code?: string;
  address?: string;
  floors: Array<{
    name: string;
    level?: number;
    floorRacks?: Array<{
      name: string;
      code?: string;
      units?: number;
      cableTerminations?: Array<{ type: string; count: number }>;
      devices?: Array<{ type: string; name: string; brand?: string; model?: string }>;
    }>;
    rooms?: Array<{
      name: string;
      type: string;
      outlets: number;
      connectionType: string;
      isTypicalRoom?: boolean;
      identicalRoomsCount?: number;
      devices?: Array<{ type: string; name: string; brand?: string; model?: string }>;
    }>;
  }>;
  centralRack?: {
    name: string;
    code?: string;
    units?: number;
    cableTerminations?: Array<{ type: string; count: number }>;
    devices?: Array<{ type: string; name: string; brand?: string; model?: string }>;
  };
}

interface BuildingConnection {
  id: string;
  fromBuilding: number;
  toBuilding: number;
  connectionType: string;
  description: string;
  distance?: number;
}

interface NetworkDiagramModalProps {
  open: boolean;
  onClose: () => void;
  buildings: Building[];
  buildingConnections: BuildingConnection[];
}

// Dagre layout setup
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 150 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: node.width || 200, height: node.height || 100 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - (node.width || 200) / 2,
        y: nodeWithPosition.y - (node.height || 100) / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// Custom Node Components
const SiteSurveyNode = ({ data }: any) => (
  <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-4 border-indigo-800 rounded-xl p-6 shadow-2xl w-[250px]">
    <div className="flex items-center gap-3 mb-3">
      <NetworkIcon className="h-8 w-8" />
      <div className="font-bold text-lg">{data.label}</div>
    </div>
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="bg-white/20 rounded px-2 py-1">
        <div className="font-semibold">{data.buildings}</div>
        <div>Buildings</div>
      </div>
      <div className="bg-white/20 rounded px-2 py-1">
        <div className="font-semibold">{data.floors}</div>
        <div>Floors</div>
      </div>
      <div className="bg-white/20 rounded px-2 py-1">
        <div className="font-semibold">{data.rooms}</div>
        <div>Rooms</div>
      </div>
      <div className="bg-white/20 rounded px-2 py-1">
        <div className="font-semibold">{data.outlets}</div>
        <div>Outlets</div>
      </div>
    </div>
  </div>
);

const BuildingNode = ({ data }: any) => (
  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-4 border-blue-700 rounded-xl p-4 shadow-2xl w-[220px]">
    <div className="flex items-center gap-2 mb-2">
      <Building2 className="h-6 w-6" />
      <div className="font-bold">{data.label}</div>
    </div>
    <div className="text-xs space-y-1 opacity-95">
      <div>📊 {data.floors} Floors</div>
      <div>🚪 {data.rooms} Rooms</div>
      <div>🔌 {data.outlets} Outlets</div>
    </div>
  </div>
);

const CentralRackNode = ({ data }: any) => (
  <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-3 border-orange-700 rounded-lg p-3 shadow-xl w-[180px]">
    <div className="flex items-center gap-2 mb-1">
      <Server className="h-5 w-5" />
      <div className="font-bold text-sm">{data.label}</div>
    </div>
    <div className="text-xs opacity-90">Central Rack</div>
    {data.code && <div className="text-xs opacity-80 mt-1">Code: {data.code}</div>}
    <div className="text-xs mt-2">💻 {data.devices} Devices</div>
  </div>
);

const FloorNode = ({ data }: any) => (
  <div className="bg-gradient-to-br from-green-500 to-green-600 text-white border-3 border-green-700 rounded-lg p-3 shadow-lg w-[160px]">
    <div className="flex items-center gap-2 mb-1">
      <NetworkIcon className="h-4 w-4" />
      <div className="font-semibold text-sm">{data.label}</div>
    </div>
    {data.level !== undefined && <div className="text-xs opacity-90">Level {data.level}</div>}
    <div className="text-xs space-y-0.5 mt-1">
      <div>🚪 {data.rooms} Rooms</div>
      <div>🔌 {data.outlets} Outlets</div>
    </div>
  </div>
);

const FloorRackNode = ({ data }: any) => (
  <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-3 border-purple-700 rounded-lg p-3 shadow-lg w-[150px]">
    <div className="flex items-center gap-2 mb-1">
      <Server className="h-4 w-4" />
      <div className="font-semibold text-xs">{data.label}</div>
    </div>
    <div className="text-xs opacity-90">Floor Rack (IDF)</div>
    {data.code && <div className="text-xs opacity-80">Code: {data.code}</div>}
    <div className="text-xs mt-1">💻 {data.devices} Dev</div>
  </div>
);

const RoomNode = ({ data }: any) => (
  <div className="bg-gradient-to-br from-gray-600 to-gray-700 text-white border-2 border-gray-800 rounded-md p-2.5 shadow-md w-[130px]">
    <div className="flex items-center gap-1.5 mb-1">
      <Home className="h-3.5 w-3.5" />
      <div className="font-semibold text-xs">{data.label}</div>
    </div>
    <div className="text-xs opacity-90">{data.roomType}</div>
    {data.isTypical && (
      <div className="text-xs bg-blue-500 px-1.5 py-0.5 rounded mt-1">
        Typical ({data.count}x)
      </div>
    )}
    <div className="text-xs mt-1">🔌 {data.outlets}</div>
  </div>
);

const DeviceNode = ({ data }: any) => (
  <div className="bg-gradient-to-br from-cyan-400 to-cyan-500 text-white border-2 border-cyan-600 rounded p-2 shadow-md w-[110px]">
    <div className="font-semibold text-xs">{data.icon} {data.label}</div>
    <div className="text-xs opacity-90">{data.deviceType}</div>
    {data.model && <div className="text-xs opacity-80">{data.model}</div>}
  </div>
);

const nodeTypes = {
  siteSurvey: SiteSurveyNode,
  building: BuildingNode,
  centralRack: CentralRackNode,
  floor: FloorNode,
  floorRack: FloorRackNode,
  room: RoomNode,
  device: DeviceNode,
};

const getConnectionColor = (type: string) => {
  switch (type) {
    case 'FIBER': return '#10B981';
    case 'WIRELESS': return '#3B82F6';
    case 'COAXIAL': return '#F59E0B';
    case 'ETHERNET': return '#8B5CF6';
    case 'POWERLINE': return '#EF4444';
    default: return '#6B7280';
  }
};

const getConnectionIcon = (type: string) => {
  switch (type) {
    case 'FIBER': return '🔗';
    case 'WIRELESS': return '📡';
    case 'COAXIAL': return '📺';
    case 'ETHERNET': return '🔌';
    case 'POWERLINE': return '⚡';
    default: return '🔗';
  }
};

const getDeviceIcon = (deviceType: string) => {
  const icons: { [key: string]: string } = {
    'ROUTER': '🌐', 'SWITCH': '🔀', 'ACCESS_POINT': '📡',
    'HEADEND_RECEIVER': '📡', 'HEADEND_AMPLIFIER': '📶',
    'HEADEND_MODULATOR': '📺', 'HEADEND_ENCODER': '🎥',
    'IOT_SENSOR': '📊', 'IOT_GATEWAY': '🌐', 'IOT_CONTROLLER': '🎛️',
    'PHONE': '☎️', 'TV': '📺',
  };
  return icons[deviceType] || '🔌';
};

export function NetworkDiagramModal({ open, onClose, buildings, buildingConnections }: NetworkDiagramModalProps) {
  // Debug: Log the received data
  console.log("NetworkDiagramModal - Buildings data:", buildings);
  console.log("NetworkDiagramModal - Building connections:", buildingConnections);
  console.log("Buildings length:", buildings?.length);
  console.log("Building connections length:", buildingConnections?.length);
  
  // Generate initial nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Check if we have buildings data
    if (!buildings || buildings.length === 0) {
      console.log("No buildings data available - creating test data");
      // Create test data for debugging
      const testNodes = [
        {
          id: 'test-site',
          type: 'siteSurvey',
          position: { x: 0, y: 0 },
          data: { label: 'SITE SURVEY', buildings: 1, floors: 1, rooms: 1, outlets: 2 },
          width: 250,
          height: 140,
        },
        {
          id: 'test-building',
          type: 'building',
          position: { x: 0, y: 0 },
          data: { label: 'Test Building', floors: 1, rooms: 1, outlets: 2 },
          width: 220,
          height: 120,
        }
      ];
      
      const testEdges = [
        {
          id: 'test-edge',
          source: 'test-site',
          target: 'test-building',
          type: 'smoothstep',
          style: { stroke: '#1E40AF', strokeWidth: 4 },
          label: 'Test Connection',
          labelStyle: { fill: '#1E40AF', fontWeight: 700, fontSize: 12 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#1E40AF' },
        }
      ];
      
      return { initialNodes: testNodes, initialEdges: testEdges };
    }

    // 0. SITE SURVEY ROOT NODE
    const siteSurveyId = 'site-survey-root';
    const totalBuildings = buildings.length;
    const totalFloors = buildings.reduce((a, b) => a + (b.floors?.length || 0), 0);
    const totalRooms = buildings.reduce((a, b) => 
      a + (b.floors?.reduce((f, floor) => f + (floor.rooms?.length || 0), 0) || 0), 0);
    const totalOutlets = buildings.reduce((a, b) => 
      a + (b.floors?.reduce((f, floor) => 
        f + (floor.rooms?.reduce((r, room) => r + room.outlets * (room.isTypicalRoom ? (room.identicalRoomsCount || 1) : 1), 0) || 0), 0) || 0), 0);

    nodes.push({
      id: siteSurveyId,
      type: 'siteSurvey',
      position: { x: 0, y: 0 },
      data: { 
        label: 'SITE SURVEY', 
        buildings: totalBuildings, 
        floors: totalFloors, 
        rooms: totalRooms, 
        outlets: totalOutlets 
      },
      width: 250,
      height: 140,
    });

    buildings.forEach((building, bIdx) => {
      const buildingId = `b${bIdx}`;

      // Calculate metrics for this building
      const buildingFloors = building.floors?.length || 0;
      const buildingRooms = building.floors?.reduce((a, f) => a + (f.rooms?.length || 0), 0) || 0;
      const buildingOutlets = building.floors?.reduce((a, f) => 
        a + (f.rooms?.reduce((r, room) => r + room.outlets * (room.isTypicalRoom ? (room.identicalRoomsCount || 1) : 1), 0) || 0), 0) || 0;

      // 1. BUILDING NODE
      nodes.push({
        id: buildingId,
        type: 'building',
        position: { x: 0, y: 0 }, // Dagre will calculate position
        data: { label: building.name, code: building.code, floors: buildingFloors, rooms: buildingRooms, outlets: buildingOutlets },
        width: 220,
        height: 120,
      });

      // Site Survey → Building
      edges.push({
        id: `${siteSurveyId}-${buildingId}-edge`,
        source: siteSurveyId,
        target: buildingId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#1E40AF', strokeWidth: 4 },
        label: `Building ${bIdx + 1}`,
        labelStyle: { fill: '#1E40AF', fontWeight: 700, fontSize: 12 },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#1E40AF' },
      });

      // 2. CENTRAL RACK
      if (building.centralRack) {
        const crId = `${buildingId}-cr`;
        nodes.push({
          id: crId,
          type: 'centralRack',
          position: { x: 0, y: 0 },
          data: { 
            label: building.centralRack.name, 
            code: building.centralRack.code,
            devices: building.centralRack.devices?.length || 0 
          },
          width: 180,
          height: 100,
        });

        // Building → Central Rack
        edges.push({
          id: `${buildingId}-cr-edge`,
          source: buildingId,
          target: crId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#F97316', strokeWidth: 4 },
          label: '📡 Main Distribution',
          labelStyle: { fill: '#F97316', fontWeight: 700, fontSize: 11 },
          labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#F97316' },
        });

        // Central Rack Devices
        building.centralRack.devices?.slice(0, 5).forEach((device, dIdx) => {
          const devId = `${crId}-d${dIdx}`;
          nodes.push({
            id: devId,
            type: 'device',
            position: { x: 0, y: 0 },
            data: { label: device.name, deviceType: device.type, brand: device.brand, model: device.model, icon: getDeviceIcon(device.type) },
            width: 110,
            height: 60,
          });
          
          edges.push({
            id: `${crId}-d${dIdx}-edge`,
            source: crId,
            target: devId,
            type: 'straight',
            style: { stroke: '#06B6D4', strokeWidth: 2 },
          });
        });
      }

      // 3. FLOORS
      building.floors?.forEach((floor, fIdx) => {
        const floorId = `${buildingId}-f${fIdx}`;

        const floorRooms = floor.rooms?.length || 0;
        const floorOutlets = floor.rooms?.reduce((a, r) => a + r.outlets * (r.isTypicalRoom ? (r.identicalRoomsCount || 1) : 1), 0) || 0;

        nodes.push({
          id: floorId,
          type: 'floor',
          position: { x: 0, y: 0 },
          data: { label: floor.name, level: floor.level, rooms: floorRooms, outlets: floorOutlets, racks: floor.floorRacks?.length || 0 },
          width: 160,
          height: 90,
        });

        // Central Rack → Floor
        if (building.centralRack) {
          edges.push({
            id: `${buildingId}-cr-f${fIdx}-edge`,
            source: `${buildingId}-cr`,
            target: floorId,
            type: 'smoothstep',
            style: { stroke: '#22C55E', strokeWidth: 3 },
            label: `Floor ${floor.level !== undefined ? floor.level : fIdx + 1}`,
            labelStyle: { fill: '#22C55E', fontWeight: 600, fontSize: 10 },
            labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#22C55E' },
          });
        }

        // 4. FLOOR RACKS
        floor.floorRacks?.forEach((rack, rIdx) => {
          const rackId = `${floorId}-r${rIdx}`;

          nodes.push({
            id: rackId,
            type: 'floorRack',
            position: { x: 0, y: 0 },
            data: { label: rack.name, code: rack.code, devices: rack.devices?.length || 0 },
            width: 150,
            height: 85,
          });

          // Floor → Floor Rack
          edges.push({
            id: `${floorId}-r${rIdx}-edge`,
            source: floorId,
            target: rackId,
            type: 'smoothstep',
            style: { stroke: '#8B5CF6', strokeWidth: 3 },
            label: '🔗 IDF',
            labelStyle: { fill: '#8B5CF6', fontWeight: 600, fontSize: 10 },
            labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#8B5CF6' },
          });

          // Floor Rack Devices
          rack.devices?.slice(0, 4).forEach((device, dIdx) => {
            const devId = `${rackId}-d${dIdx}`;
            nodes.push({
              id: devId,
              type: 'device',
              position: { x: 0, y: 0 },
              data: { label: device.name, deviceType: device.type, brand: device.brand, model: device.model, icon: getDeviceIcon(device.type) },
              width: 110,
              height: 60,
            });

            edges.push({
              id: `${rackId}-d${dIdx}-edge`,
              source: rackId,
              target: devId,
              type: 'straight',
              style: { stroke: '#06B6D4', strokeWidth: 2 },
            });
          });
        });

        // 5. ROOMS
        floor.rooms?.slice(0, 8).forEach((room, roomIdx) => {
          const roomId = `${floorId}-room${roomIdx}`;

          nodes.push({
            id: roomId,
            type: 'room',
            position: { x: 0, y: 0 },
            data: { 
              label: room.name, 
              roomType: room.type, 
              outlets: room.outlets,
              devices: room.devices?.length || 0,
              isTypical: room.isTypicalRoom,
              count: room.identicalRoomsCount,
            },
            width: 130,
            height: 80,
          });

          // Floor → Room (always connect floor to room)
          edges.push({
            id: `${floorId}-${roomId}-edge`,
            source: floorId,
            target: roomId,
            type: 'smoothstep',
            style: { stroke: '#10B981', strokeWidth: 2 },
            label: `${room.outlets} outlets`,
            labelStyle: { fill: '#10B981', fontWeight: 500, fontSize: 9 },
            labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#10B981' },
          });

          // Floor Rack/Central Rack → Room (additional connection based on room type)
          if (room.connectionType === 'CENTRAL_RACK' && building.centralRack) {
            edges.push({
              id: `cr-${roomId}-edge`,
              source: `${buildingId}-cr`,
              target: roomId,
              type: 'smoothstep',
              style: { stroke: '#DC2626', strokeWidth: 2.5, strokeDasharray: '5,5' },
              label: '⚡ Direct',
              labelStyle: { fill: '#DC2626', fontWeight: 600, fontSize: 9 },
              labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#DC2626' },
            });
          } else if (floor.floorRacks?.[0]) {
            edges.push({
              id: `${floorId}-r0-${roomId}-edge`,
              source: `${floorId}-r0`,
              target: roomId,
              type: 'smoothstep',
              style: { stroke: '#64748B', strokeWidth: 2 },
              label: `${room.outlets} outlets`,
              labelStyle: { fill: '#64748B', fontWeight: 500, fontSize: 9 },
              labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#64748B' },
            });
          }

          // Room Devices
          room.devices?.slice(0, 3).forEach((device, dIdx) => {
            const devId = `${roomId}-d${dIdx}`;
            nodes.push({
              id: devId,
              type: 'device',
              position: { x: 0, y: 0 },
              data: { label: device.name, deviceType: device.type, brand: device.brand, model: device.model, icon: getDeviceIcon(device.type) },
              width: 110,
              height: 60,
            });

            edges.push({
              id: `${roomId}-d${dIdx}-edge`,
              source: roomId,
              target: devId,
              type: 'straight',
              style: { stroke: '#06B6D4', strokeWidth: 1.5 },
            });
          });
        });
      });
    });

    // 6. BUILDING INTERCONNECTIONS
    buildingConnections.forEach((conn) => {
      const connectionIcon = getConnectionIcon(conn.connectionType);
      const label = `${connectionIcon} ${conn.connectionType}${conn.distance ? ` - ${conn.distance}m` : ''}${conn.description ? `\n${conn.description}` : ''}`;
      
      edges.push({
        id: `conn-${conn.id}`,
        source: `b${conn.fromBuilding}`,
        target: `b${conn.toBuilding}`,
        type: 'smoothstep',
        animated: conn.connectionType === 'WIRELESS',
        style: {
          stroke: getConnectionColor(conn.connectionType),
          strokeWidth: 6,
          strokeDasharray: '15,8', // Always dashed for building connections
        },
        label,
        labelStyle: { 
          fill: getConnectionColor(conn.connectionType), 
          fontWeight: 800,
          fontSize: 12,
        },
        labelBgStyle: { 
          fill: '#ffffff', 
          fillOpacity: 0.98,
          stroke: getConnectionColor(conn.connectionType),
          strokeWidth: 1,
        },
        markerEnd: { 
          type: MarkerType.ArrowClosed, 
          color: getConnectionColor(conn.connectionType), 
          width: 25, 
          height: 25 
        },
        markerStart: { 
          type: MarkerType.ArrowClosed, 
          color: getConnectionColor(conn.connectionType), 
          width: 25, 
          height: 25 
        },
      });
    });

    console.log("Generated nodes:", nodes.length);
    console.log("Generated edges:", edges.length);
    console.log("Edge details:", edges.map(e => ({ id: e.id, source: e.source, target: e.target, style: e.style })));
    
    return { initialNodes: nodes, initialEdges: edges };
  }, [buildings, buildingConnections]);

  // Apply Dagre layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getLayoutedElements(initialNodes, initialEdges, 'TB');
  }, [initialNodes, initialEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Update nodes and edges when layouted data changes
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  const onLayout = useCallback((direction: 'TB' | 'LR') => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, direction);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [nodes, edges, setNodes, setEdges]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[80vw] max-h-[80vh] h-[80vh] p-0 z-[9999]">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <NetworkIcon className="h-6 w-6 text-blue-600" />
              NETWORK INFRASTRUCTURE DIAGRAM
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="w-full h-[calc(80vh-100px)]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={2}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{
              style: { strokeWidth: 2 },
              type: 'smoothstep',
            }}
          >
            <Background 
              variant={BackgroundVariant.Dots}
              color="#d1d5db" 
              gap={24} 
              size={1.5}
            />
            <Controls showInteractive={false} />
            <MiniMap 
              nodeColor={(node) => {
                const colors: { [key: string]: string } = {
                  'building': '#3B82F6',
                  'centralRack': '#F97316',
                  'floor': '#22C55E',
                  'floorRack': '#8B5CF6',
                  'room': '#64748B',
                  'device': '#06B6D4',
                };
                return colors[node.type || 'default'] || '#6B7280';
              }}
              maskColor="rgba(0, 0, 0, 0.15)"
              position="bottom-right"
            />
            
            {/* Legend Panel */}
            <Panel position="top-left" className="bg-white/95 backdrop-blur p-3 rounded-lg shadow-lg border-2 border-gray-200">
              <div className="space-y-2">
                <h3 className="font-bold text-xs mb-2 text-gray-800">HIERARCHY</h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-br from-indigo-600 to-purple-700 rounded border-2 border-indigo-800"></div>
                    <span className="font-semibold">Site Survey</span>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <div className="w-3.5 h-3.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded border-2 border-blue-700"></div>
                    <span>Buildings</span>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <div className="w-3 h-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded border-2 border-orange-700"></div>
                    <span>Central Rack</span>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <div className="w-3 h-3 bg-gradient-to-br from-green-500 to-green-600 rounded border-2 border-green-700"></div>
                    <span>Floors</span>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="w-3 h-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded border-2 border-purple-700"></div>
                    <span>Floor Racks</span>
                  </div>
                  <div className="flex items-center gap-2 ml-6">
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-gray-600 to-gray-700 rounded border border-gray-800"></div>
                    <span>Rooms</span>
                  </div>
                  <div className="flex items-center gap-2 ml-8">
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded border border-cyan-600"></div>
                    <span>Devices</span>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Layout Controls */}
            <Panel position="top-right" className="bg-white/95 backdrop-blur p-3 rounded-lg shadow-lg border-2 border-gray-200">
              <div className="space-y-2">
                <h3 className="font-bold text-xs mb-2">LAYOUT</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onLayout('TB')}
                  className="w-full text-xs"
                >
                  ⬇️ Vertical
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onLayout('LR')}
                  className="w-full text-xs"
                >
                  ➡️ Horizontal
                </Button>
              </div>
            </Panel>

            {/* Connection Types Legend */}
            <Panel position="bottom-left" className="bg-white/95 backdrop-blur p-3 rounded-lg shadow-lg border-2 border-gray-200 max-w-[280px]">
              <div className="space-y-2">
                <h3 className="font-bold text-xs text-gray-800">CONNECTION TYPES</h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-1 rounded bg-indigo-600"></div>
                    <span>Site Survey → Buildings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-1 rounded bg-orange-500"></div>
                    <span>📡 Main Distribution</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-1 rounded bg-green-500"></div>
                    <span>Building → Floor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-1 rounded bg-purple-500"></div>
                    <span>🔗 Floor → IDF</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-1 rounded bg-gray-600"></div>
                    <span>IDF → Rooms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-0.5 border-t-2 border-dashed border-red-600"></div>
                    <span>⚡ Direct</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-1 rounded bg-cyan-600"></div>
                    <span>Device Links</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-0.5 border-t-2 border-dashed border-green-500"></div>
                    <span>🔗 Building Connections</span>
                  </div>
                </div>
                
                {buildingConnections.length > 0 && (
                  <>
                    <div className="pt-2 border-t mt-2">
                      <div className="font-semibold text-xs mb-1.5 text-gray-700">Building Links:</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-1.5 rounded bg-green-500"></div>
                          <span>🔗 Fiber</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-0.5 border-t-2 border-dashed border-blue-500"></div>
                          <span>📡 Wireless</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-1.5 rounded bg-orange-500"></div>
                          <span>📺 Coaxial</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-1.5 rounded bg-purple-500"></div>
                          <span>🌐 Ethernet</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Panel>

            {/* Stats Panel */}
            <Panel position="top-center" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-lg shadow-xl border-2 border-blue-700">
              <div className="flex gap-6 text-xs font-semibold">
                <div>🏢 {buildings.length} Buildings</div>
                <div>📊 {buildings.reduce((acc, b) => acc + (b.floors?.length || 0), 0)} Floors</div>
                <div>🚪 {buildings.reduce((acc, b) => acc + (b.floors?.reduce((fAcc, f) => fAcc + (f.rooms?.length || 0), 0) || 0), 0)} Rooms</div>
                <div>🔗 {buildingConnections.length} Building Links</div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </DialogContent>
    </Dialog>
  );
}
