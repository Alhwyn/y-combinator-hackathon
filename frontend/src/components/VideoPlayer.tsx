import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Radio, Monitor, Smartphone } from "lucide-react";
import { useState } from "react";

export const VideoPlayer = () => {
  const [isMobile, setIsMobile] = useState(false);

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
        {isMobile ? (
          /* Mobile View - Centered with grey bars */
          <div className="h-full flex items-center justify-center">
            {/* Mobile viewport container */}
            <div className="relative h-full aspect-[9/16] bg-black">
              {/* Live Stream Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
                    <Radio className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-base font-medium">Live Test Execution</p>
                  <p className="text-xs text-white/70">Mobile testing in progress</p>
                </div>
              </div>
              
              {/* Live Indicator */}
              <div className="absolute top-4 left-4">
                <div className="flex items-center gap-2 bg-red-500 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white text-sm font-medium">LIVE</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Browser View - Full width */
          <div className="relative w-full h-full bg-black">
            {/* Live Stream Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
                  <Radio className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-lg font-medium">Live Test Execution</p>
                <p className="text-sm text-white/70">Watching tests run in real-time</p>
              </div>
            </div>
            
            {/* Live Indicator */}
            <div className="absolute top-4 left-4">
              <div className="flex items-center gap-2 bg-red-500 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">LIVE</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

