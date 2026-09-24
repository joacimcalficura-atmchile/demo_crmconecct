'use client';

import React, { useState, useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, PlusCircle, MessageSquare, DollarSign, Image as ImageIcon, Upload } from 'lucide-react';

const initialNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'input',
    position: { x: 250, y: 100 },
    data: { baseLabel: 'trigger', label: '💬 Cliente dice: "Precio"', config: { keyword: 'Precio' } },
    style: { 
      background: 'rgba(15, 23, 42, 0.8)', 
      border: '2px solid #38bdf8',
      borderRadius: '12px',
      padding: '16px',
      fontWeight: 'bold',
      color: '#ffffff',
      boxShadow: '0 10px 25px rgba(56, 189, 248, 0.15)',
      backdropFilter: 'blur(12px)'
    },
  },
  {
    id: 'action-1',
    position: { x: 250, y: 250 },
    data: { baseLabel: 'image', label: '🖼️ Enviar Imagen de Tarifario', config: { url: '' } },
    style: { 
      background: 'rgba(30, 41, 59, 0.8)', 
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      padding: '16px',
      color: '#cbd5e1',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      backdropFilter: 'blur(12px)'
    },
  },
  {
    id: 'action-2',
    type: 'output',
    position: { x: 250, y: 400 },
    data: { baseLabel: 'payment', label: '💳 Solicitar anticipo · demo', config: { price: '0', url: '' } },
    style: { 
      background: 'rgba(15, 23, 42, 0.8)', 
      border: '2px solid #10b981',
      borderRadius: '12px',
      padding: '16px',
      fontWeight: 'bold',
      color: '#34d399',
      boxShadow: '0 10px 25px rgba(16, 185, 129, 0.15)',
      backdropFilter: 'blur(12px)'
    },
  }
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'trigger-1', target: 'action-1', animated: true, style: { stroke: '#475569', strokeWidth: 2 } },
  { id: 'e2-3', source: 'action-1', target: 'action-2', animated: true, style: { stroke: '#475569', strokeWidth: 2 } },
];

export default function FlowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
    setSelectedNode(nodes.length > 0 ? nodes[0] : null);
  }, []);

  const onConnect = useCallback((params: Connection | Edge) => {
    setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#475569', strokeWidth: 2 } }, eds));
  }, [setEdges]);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call to save flow configuration
    setTimeout(() => {
      setIsSaving(false);
      alert('Flujo guardado con éxito. El bot ahora respetará esta automatización prioritaria.');
    }, 1000);
  };

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      position: { x: 100, y: 100 },
      data: { baseLabel: type, label: 'Nuevo Nodo', config: {} },
      style: {
        background: 'rgba(30, 41, 59, 0.8)', 
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '16px',
        color: '#cbd5e1',
        backdropFilter: 'blur(12px)'
      }
    };

    if (type === 'trigger') {
      newNode.type = 'input';
      newNode.data.label = '💬 Cliente dice: "..."';
      newNode.style!.border = '2px solid #38bdf8';
      newNode.style!.color = '#ffffff';
    } else if (type === 'payment') {
      newNode.type = 'output';
      newNode.data.label = '💳 Enviar Link de Pago';
      newNode.style!.border = '2px solid #10b981';
      newNode.style!.color = '#34d399';
    } else if (type === 'image') {
      newNode.data.label = '🖼️ Enviar Imagen Adjunta';
    }

    setNodes((nds) => [...nds, newNode]);
  };

  const updateNodeConfig = (key: string, value: string) => {
    if (!selectedNode) return;
    
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          const newData = { ...node.data, config: { ...(node.data.config || {}), [key]: value } };
          
          if (newData.baseLabel === 'trigger' && key === 'keyword') {
            newData.label = `💬 Cliente dice: "${value}"`;
          } else if (newData.baseLabel === 'payment' && key === 'price') {
            newData.label = `💳 Pagar: $${value}`;
          }
          
          return { ...node, data: newData };
        }
        return node;
      })
    );
    
    setSelectedNode((prev) => prev ? { ...prev, data: { ...prev.data, config: { ...(prev.data.config || {}), [key]: value } } } : null);
  };

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        fitView
        className="bg-transparent"
      >
        <Controls className="bg-white/80 dark:bg-white/10 border-slate-200 dark:border-white/10 shadow-sm rounded-lg backdrop-blur-md fill-slate-700 dark:fill-white text-slate-700 dark:text-white" />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'input') return '#0284c7';
            if (n.type === 'output') return '#059669';
            return '#334155';
          }}
          maskColor="rgba(15, 23, 42, 0.7)"
          className="rounded-lg shadow-sm border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/60"
        />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#334155" />

        <Panel position="top-right" className="flex gap-2 m-4">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Guardando...' : 'Guardar Flujo'}
          </button>
        </Panel>

        <Panel position="top-left" className="m-4 flex gap-4">
          <div className="glass-panel p-2 rounded-2xl shadow-xl flex flex-col gap-2 h-fit">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 pt-1">Agregar Bloque</span>
            
            <button onClick={() => addNode('trigger')} className="flex items-center gap-3 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors text-sm font-medium text-left">
              <div className="bg-sky-500/20 border border-sky-500/30 p-1.5 rounded-lg text-sky-600 dark:text-sky-400"><MessageSquare className="w-4 h-4" /></div>
              Disparador (Trigger)
            </button>
            
            <button onClick={() => addNode('image')} className="flex items-center gap-3 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors text-sm font-medium text-left">
              <div className="bg-slate-500/20 border border-slate-500/30 p-1.5 rounded-lg text-slate-600 dark:text-slate-400"><ImageIcon className="w-4 h-4" /></div>
              Enviar Imagen
            </button>
            
            <button onClick={() => addNode('payment')} className="flex items-center gap-3 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors text-sm font-medium text-left">
              <div className="bg-emerald-500/20 border border-emerald-500/30 p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400"><DollarSign className="w-4 h-4" /></div>
              Link de Pago
            </button>
          </div>

          {selectedNode && (
            <div className="glass-panel p-4 rounded-2xl shadow-2xl flex flex-col gap-4 w-72 animate-in fade-in slide-in-from-left-4 text-slate-900 dark:text-white">
              <div className="pb-3 border-b border-slate-200 dark:border-white/10">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Configuración del Bloque</span>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">{selectedNode.data.label}</h3>
              </div>

              {selectedNode.data.baseLabel === 'trigger' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Palabra Clave (Keyword)</label>
                  <input 
                    type="text" 
                    value={selectedNode.data.config?.keyword || ''}
                    onChange={(e) => updateNodeConfig('keyword', e.target.value)}
                    placeholder="Ej. precio, valor, costo"
                    className="w-full text-sm p-2 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-1">
                    Cuando el cliente envíe esta palabra, el flujo se activará automáticamente sin consultar a la IA.
                  </p>
                </div>
              )}

              {selectedNode.data.baseLabel === 'image' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subir Imagen (Tarifario / Transferencia)</label>
                  <label className="flex items-center justify-center gap-2 cursor-pointer w-full text-sm p-3 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 border-dashed rounded-lg hover:bg-black/10 dark:hover:bg-white/10 hover:border-sky-400 dark:hover:border-sky-400 transition-colors">
                    <Upload className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Seleccionar Archivo</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Preview logic here
                          updateNodeConfig('fileName', file.name);
                        }
                      }}
                    />
                  </label>
                  {selectedNode.data.config?.fileName && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-500/30 p-1.5 rounded-md truncate">
                      ✓ {selectedNode.data.config.fileName}
                    </span>
                  )}
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-1">
                    Esta imagen se enviará de forma <strong className="text-slate-900 dark:text-white">nativa por WhatsApp</strong> (como foto real, no como un link de texto).
                  </p>
                </div>
              )}

              {selectedNode.data.baseLabel === 'payment' && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Monto Fijo ($)</label>
                    <input 
                      type="number" 
                      value={selectedNode.data.config?.price || ''}
                      onChange={(e) => updateNodeConfig('price', e.target.value)}
                      placeholder="99990"
                      className="w-full text-sm p-2 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Link de Pago (MercadoPago/Stripe)</label>
                    <input 
                      type="text" 
                      value={selectedNode.data.config?.url || ''}
                      onChange={(e) => updateNodeConfig('url', e.target.value)}
                      placeholder="https://mpago.li/..."
                      className="w-full text-sm p-2 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                </div>
              )}

              <button className="mt-2 w-full text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-white bg-rose-500/10 dark:bg-rose-900/40 hover:bg-rose-500 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-500/30 py-2 rounded-lg transition-colors"
                onClick={() => {
                  setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
                  setEdges(eds => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
                  setSelectedNode(null);
                }}
              >
                Eliminar Bloque
              </button>
            </div>
          )}
        </Panel>
      </ReactFlow>
    </div>
  );
}
