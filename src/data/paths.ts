/**
 * Firestore path builders — every document lives under `users/{uid}/...`, so
 * every read/write path is scoped to the signed-in user by construction, not
 * just by convention. `childStats` nests under its owning domain (a natural
 * parent-child relationship); everything else is a flat collection under the
 * user, mirroring the old SQLite table layout.
 */

export function domainsPath(uid: string): string {
  return `users/${uid}/domains`;
}

export function domainPath(uid: string, domainId: string): string {
  return `${domainsPath(uid)}/${domainId}`;
}

export function childStatsPath(uid: string, domainId: string): string {
  return `${domainPath(uid, domainId)}/childStats`;
}

export function childStatPath(uid: string, domainId: string, childStatId: string): string {
  return `${childStatsPath(uid, domainId)}/${childStatId}`;
}

export function questsPath(uid: string): string {
  return `users/${uid}/quests`;
}

export function questPath(uid: string, questId: string): string {
  return `${questsPath(uid)}/${questId}`;
}

export function dailyQuestsPath(uid: string): string {
  return `users/${uid}/dailyQuests`;
}

export function dailyQuestPath(uid: string, dailyQuestId: string): string {
  return `${dailyQuestsPath(uid)}/${dailyQuestId}`;
}

export function xpEventsPath(uid: string): string {
  return `users/${uid}/xpEvents`;
}

export function xpEventPath(uid: string, xpEventId: string): string {
  return `${xpEventsPath(uid)}/${xpEventId}`;
}
