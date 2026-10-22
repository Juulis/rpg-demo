import anchorsFile from '../data/questAnchors.json';

export interface QuestAnchorDef {
  id: string;
  areaId: string;
  pos: [number, number];
  radius: number;
}

const anchors = (anchorsFile as unknown as { anchors: QuestAnchorDef[] }).anchors;

export function questAnchorsForArea(areaId: string): QuestAnchorDef[] {
  return anchors.filter((a) => a.areaId === areaId);
}

export function questAnchorById(id: string): QuestAnchorDef | undefined {
  return anchors.find((a) => a.id === id);
}
