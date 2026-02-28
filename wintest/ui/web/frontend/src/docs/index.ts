import type { ActionDoc } from './types';
import { clickDoc } from './click';
import { doubleClickDoc } from './double_click';
import { rightClickDoc } from './right_click';
import { typeDoc } from './type';
import { pressKeyDoc } from './press_key';
import { hotkeyDoc } from './hotkey';
import { scrollDoc } from './scroll';
import { waitDoc } from './wait';
import { verifyDoc } from './verify';
import { launchApplicationDoc } from './launch_application';

export type { ActionDoc, ActionParam } from './types';

const allDocs: ActionDoc[] = [
  launchApplicationDoc,
  clickDoc,
  doubleClickDoc,
  rightClickDoc,
  typeDoc,
  pressKeyDoc,
  hotkeyDoc,
  scrollDoc,
  waitDoc,
  verifyDoc,
];

export const actionDocs: Record<string, ActionDoc> = Object.fromEntries(
  allDocs.map(doc => [doc.name, doc]),
);

export const actionDocList: ActionDoc[] = allDocs;
