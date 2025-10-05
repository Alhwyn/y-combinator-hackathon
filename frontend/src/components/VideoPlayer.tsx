import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Radio, Monitor, Smartphone, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import config from "../../config";

interface VideoPlayerProps {
  agentId?: string;
  onAgentEvent?: (event: any) => void;
}

export const VideoPlayer = ({ agentId, onAgentEvent }: VideoPlayerProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket for live video stream
    const connectWebSocket = () => {
      try {
        const wsUrl = config.ws.viewer;
        console.log('🔌 Connecting to video stream:', wsUrl);
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('✅ WebSocket connected');
          setIsConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          try {
            if (!event.data) {
              console.error('❌ Received empty message from server');
              return;
            }
            
            const message = JSON.parse(event.data);
            console.log('📨 Message received:', message.type, message);
            
            if (!message.type) {
              console.error('❌ Message missing type field:', message);
              return;
            }
            
            switch (message.type) {
              case 'agent_list':
                if (!Array.isArray(message.agents)) {
                  console.error('❌ Invalid agent_list format:', message);
                  break;
                }
                console.log(`📋 Received agent list: ${message.agents.length} agents`);
                break;
              
              case 'agent_connected':
                if (!message.agentId || !message.agentName) {
                  console.error('❌ Invalid agent_connected data:', message);
                  break;
                }
                console.log(`🤖 New agent connected: ${message.agentName} (${message.agentId})`);
                if (onAgentEvent) {
                  onAgentEvent(message);
                }
                break;
              
              case 'agent_disconnected':
                if (!message.agentId) {
                  console.error('❌ Invalid agent_disconnected data:', message);
                  break;
                }
                console.log(`📴 Agent disconnected: ${message.agentId}`);
                if (onAgentEvent) {
                  onAgentEvent(message);
                }
                break;
              
              case 'frame':
                if (!message.agentId || !message.frame) {
                  console.error('❌ Invalid frame data:', {
                    agentId: message.agentId,
                    hasFrame: !!message.frame,
                    testId: message.testId
                  });
                  break;
                }
                
                // Update frame if no specific agent filter, or if it matches
                if (!agentId || message.agentId === agentId) {
                  // Dashboard adds data URL prefix, frame comes as base64 only
                  const dataUrl = `data:image/jpeg;base64,${message.frame}`;
                  setCurrentFrame(dataUrl);
                }
                break;
              
              case 'test_started':
                if (!message.agentId || !message.testId) {
                  console.error('❌ Invalid test_started data:', message);
                  break;
                }
                console.log(`🧪 Test started: ${message.testId} on agent ${message.agentId}`);
                if (onAgentEvent) {
                  onAgentEvent(message);
                }
                break;
              
              case 'test_completed':
                if (!message.agentId || !message.testId) {
                  console.error('❌ Invalid test_completed data:', message);
                  break;
                }
                console.log(`✅ Test completed: ${message.testId} on agent ${message.agentId}`);
                if (onAgentEvent) {
                  onAgentEvent(message);
                }
                break;
              
              default:
                console.warn('⚠️ Unknown message type:', message.type);
                if (onAgentEvent) {
                  onAgentEvent(message);
                }
            }
          } catch (parseError) {
            console.error('❌ Failed to parse WebSocket message:', {
              error: parseError.message,
              stack: parseError.stack,
              rawData: event.data
            });
          }
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          setError('Connection error');
          setIsConnected(false);
        };

        ws.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          setIsConnected(false);
          
          // Attempt to reconnect after 3 seconds
          setTimeout(() => {
            if (wsRef.current?.readyState === WebSocket.CLOSED) {
              console.log('🔄 Attempting to reconnect...');
              connectWebSocket();
            }
          }, 3000);
        };
      } catch (error) {
        console.error('❌ Failed to connect to WebSocket:', error);
        setError('Failed to connect');
      }
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [agentId, onAgentEvent]);

  // Render frame to canvas - EXACTLY like dashboard does it
  useEffect(() => {
    if (currentFrame && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        const img = new Image();
        
        img.onerror = (error) => {
          console.error('❌ Image load error:', {
            error: error,
            src: currentFrame?.substring(0, 50) + '...'
          });
        };
        
        img.onload = () => {
          console.log('✅ Frame loaded successfully');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
        };
        
        img.src = currentFrame;
      }
    }
  }, [currentFrame]);

  return (
    <Card className="bg-card border-border overflow-hidden">
      {/* Toggle Switch */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Monitor className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="aspect-toggle" className="text-sm font-medium">
              Browser View
            </Label>
          </div>
          <Switch
            id="aspect-toggle"
            checked={isMobile}
            onCheckedChange={setIsMobile}
          />
          <div className="flex items-center gap-3">
            <Label htmlFor="aspect-toggle" className="text-sm font-medium">
              Mobile View
            </Label>
            <Smartphone className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
      
      {/* Fixed aspect-video container for both views */}
      <div className="relative bg-muted/30 aspect-video overflow-hidden">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center text-white">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <p className="text-base font-medium">Connection Error</p>
              <p className="text-xs text-white/70">{error}</p>
            </div>
          </div>
        )}
        
        {isMobile ? (
          /* Mobile View - Centered with grey bars */
          <div className="h-full flex items-center justify-center">
            {/* Mobile viewport container */}
            <div className="relative h-full aspect-[9/16] bg-black">
              {/* Live Stream Content */}
              {currentFrame ? (
                <canvas 
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
                      <Radio className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-base font-medium">
                      {isConnected ? 'Waiting for stream...' : 'Connecting...'}
                    </p>
                    <p className="text-xs text-white/70">Mobile testing</p>
                  </div>
                </div>
              )}
              
              {/* Live Indicator */}
              {isConnected && (
                <div className="absolute top-4 left-4">
                  <div className="flex items-center gap-2 bg-red-500 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-white text-sm font-medium">LIVE</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Browser View - Full width */
          <div className="relative w-full h-full bg-black">
            {/* Live Stream Content */}
            {currentFrame ? (
              <canvas 
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
                    <Radio className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-lg font-medium">
                    {isConnected ? 'Waiting for stream...' : 'Connecting...'}
                  </p>
                  <p className="text-sm text-white/70">Watching tests run in real-time</p>
                </div>
              </div>
            )}
            
            {/* Live Indicator */}
            {isConnected && (
              <div className="absolute top-4 left-4">
                <div className="flex items-center gap-2 bg-red-500 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white text-sm font-medium">LIVE</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

