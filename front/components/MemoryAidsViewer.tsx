"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MindMap from "@/components/mind-map"
import MemoryMnemonic from "@/components/memory-mnemonic"
import SensoryAssociation from "@/components/sensory-association"
import type { MemoryAids } from "@/lib/types"

interface MemoryAidsViewerProps {
  aids: MemoryAids | null | undefined
  onShare: (type: string, content: any) => void
}

export default function MemoryAidsViewer({ aids, onShare }: MemoryAidsViewerProps) {
  if (!aids) {
    return null
  }

  return (
    <div className="w-full">
      <Tabs defaultValue="mindmap" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-3 bg-white/10">
          <TabsTrigger value="mindmap">思维导图</TabsTrigger>
          <TabsTrigger value="mnemonics">记忆口诀</TabsTrigger>
          <TabsTrigger value="sensory">感官联想</TabsTrigger>
        </TabsList>

        <TabsContent value="mindmap">
          <div className="h-[400px] w-full overflow-hidden rounded-lg border border-white/10 bg-black/50">
            {aids.mindMap && <MindMap data={aids.mindMap} />}
          </div>
        </TabsContent>

        <TabsContent value="mnemonics" className="space-y-4">
          {aids.mnemonics.map((mnemonic) => (
            <MemoryMnemonic key={mnemonic.id} mnemonic={mnemonic} onShare={() => onShare('mnemonic', mnemonic)} />
          ))}
        </TabsContent>

        <TabsContent value="sensory" className="space-y-4">
          {aids.sensoryAssociations.map((assoc) => (
            <SensoryAssociation key={assoc.id} association={assoc} onShare={() => onShare('sensory', assoc)} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
