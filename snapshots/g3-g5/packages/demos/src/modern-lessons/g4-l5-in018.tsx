"use client";
import sourceModule from '../modules/course-g04-l05-in-018';
import {G4_L5_PRODUCT_POOL_SOURCE_AUDIO} from './generated/g4-l5-product-pool-audio';
import configs from './generated/g4-l5-product-pool-config.json';
import {createProductPoolPresentation, type ProductPoolConfig} from './g4-l5-product-pool';
export const G4_L5_IN018_TEXT_PRESENTATION = createProductPoolPresentation(configs[1] as unknown as ProductPoolConfig, sourceModule.getFrameState, G4_L5_PRODUCT_POOL_SOURCE_AUDIO['course-g04-l05-in-018']);
export const binding = G4_L5_IN018_TEXT_PRESENTATION.binding;
export const ModernRenderer = G4_L5_IN018_TEXT_PRESENTATION.Renderer;
export const getSnapshot = G4_L5_IN018_TEXT_PRESENTATION.getSnapshot;
