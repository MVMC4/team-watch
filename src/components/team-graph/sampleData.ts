import { TeamData } from './types';
import sampleJson from '@/data/sample.json';

/**
 * SAMPLE_JSON — Loaded from src/data/sample.json.
 * This is the pristine source data, never mutated directly.
 * On app init, deep-cloned into workingTree.
 */
export const SAMPLE_JSON: TeamData[] = sampleJson as TeamData[];
