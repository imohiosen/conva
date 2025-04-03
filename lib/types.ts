export interface Conversation {
  text: string;
  speaker_id: number;
}

export interface Scenario {
  summary: string;
  conversation: Conversation[];
}

export interface ScenariosData {
  [key: string]: Scenario;
}

export interface AudioCache {
  url: string;
  contentType: string;
}
