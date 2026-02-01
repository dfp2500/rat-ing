// src/types/stats.ts - VERSIÓN ACTUALIZADA

import { Timestamp } from 'firebase/firestore';

export interface UserStats {
  totalRatings: number;
  averageScore: number;
  distribution: ScoreDistribution;
}

export interface ScoreDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  6: number;
  7: number;
  8: number;
  9: number;
  10: number;
}

/**
 * Estadísticas por tipo de contenido
 */
export interface ContentTypeStats {
  total: number;           // Total de items de este tipo
  averageScore: number;    // Promedio general
  user_1: UserStats;       // Stats del usuario 1
  user_2: UserStats;       // Stats del usuario 2
  agreement: AgreementStats; // Stats de acuerdo para este tipo específico
}

/**
 * Estadísticas de acuerdo/desacuerdo entre usuarios
 */
export interface AgreementStats {
  totalBothRated: number;
  perfectAgreement: number;    // diff === 0
  closeAgreement: number;      // diff <= 1
  moderateAgreement: number;   // diff <= 2
  disagreement: number;        // diff > 2
  averageDifference: number;
}

/**
 * Top items guardados en estadísticas
 */
export interface TopItem {
  id: string;
  type: 'movie' | 'series' | 'game';
  title: string;
  posterPath: string | null;
  averageScore: number;
  user1Score?: number;
  user2Score?: number;
}

/**
 * Items más controversiales
 */
export interface ControversialItem {
  id: string;
  type: 'movie' | 'series' | 'game';
  title: string;
  posterPath: string | null;
  difference: number;
  user1Score: number;
  user2Score: number;
}

/**
 * Punto de evolución temporal
 */
export interface EvolutionPoint {
  month: string;        // YYYY-MM
  average: number;
  count: number;
}

/**
 * Estadísticas globales persistidas en Firestore
 * Documento: /stats/global
 */
export interface GlobalStats {
  // ── Totales generales ──
  totalItems: number;           // Total de movies + series + games
  averageScore: number;         // Promedio de todo
  
  // ── Por tipo de contenido ──
  movies: ContentTypeStats;
  series: ContentTypeStats;
  games: ContentTypeStats;
  
  // ── Stats de acuerdo (global) ──
  agreement: AgreementStats;
  
  // ── Top 10 mejor valorados (global) ──
  topRated: TopItem[];
  
  // ── Top 5 más controversiales (global) ──
  mostControversial: ControversialItem[];
  
  // ── Evolución temporal (global) ──
  averageEvolution: EvolutionPoint[];
  
  // ── Metadata ──
  lastUpdated: Timestamp;
}

/**
 * Helper para crear distribución vacía
 */
export function createEmptyDistribution(): ScoreDistribution {
  return {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
  };
}

/**
 * Helper para crear UserStats vacío
 */
export function createEmptyUserStats(): UserStats {
  return {
    totalRatings: 0,
    averageScore: 0,
    distribution: createEmptyDistribution(),
  };
}

/**
 * Helper para crear ContentTypeStats vacío
 */
export function createEmptyContentTypeStats(): ContentTypeStats {
  return {
    total: 0,
    averageScore: 0,
    user_1: createEmptyUserStats(),
    user_2: createEmptyUserStats(),
    agreement: createEmptyAgreementStats(),
  };
}

/**
 * Helper para crear AgreementStats vacío
 */
export function createEmptyAgreementStats(): AgreementStats {
  return {
    totalBothRated: 0,
    perfectAgreement: 0,
    closeAgreement: 0,
    moderateAgreement: 0,
    disagreement: 0,
    averageDifference: 0,
  };
}

/**
 * Helper para crear GlobalStats vacío
 */
export function createEmptyGlobalStats(): GlobalStats {
  return {
    totalItems: 0,
    averageScore: 0,
    movies: createEmptyContentTypeStats(),
    series: createEmptyContentTypeStats(),
    games: createEmptyContentTypeStats(),
    agreement: createEmptyAgreementStats(),
    topRated: [],
    mostControversial: [],
    averageEvolution: [],
    lastUpdated: Timestamp.now(),
  };
}