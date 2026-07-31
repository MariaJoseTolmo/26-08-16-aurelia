/**
 * Seed de homologación SPR — usuarios reales (matriz histórica de negocio).
 *
 * Idempotente: puede correrse en entornos donde áreas/factores/usuarios
 * ya existen o faltan parcialmente.
 *
 * Password fija (no env): AureliaDemo123!
 *
 * SSGG → AREA-SERVICIOS (código existente; no se reemplaza por AREA-SOPERACIONALES).
 * Los factores de AREA-SOPERACIONALES se espejan a AREA-SERVICIOS para que
 * los responsables SSGG puedan reportar el mismo perímetro.
 *
 * Emails "No especificado" en la matriz → provisional first.last@goldfields.com
 * (o dominio contratista). Documentados en el arreglo USERS.
 */
import 'reflect-metadata';
import { pbkdf2, randomBytes } from 'crypto';
import { config } from 'dotenv';
import { promisify } from 'util';
import type { DataSource, QueryRunner } from 'typeorm';
import { AppDataSource } from '../data-source';

config();

const deriveKey = promisify(pbkdf2);
const FORMAT = 'pbkdf2_sha256';
const ITERATIONS = 210_000;
const KEY_LENGTH = 32;
/** Password demo fija — no usar variable de entorno. */
const DEMO_PASSWORD = 'AureliaDemo123!';

type SprRole =
  | 'SPR_RESPONSIBLE'
  | 'SPR_AREA_MANAGER'
  | 'SPR_SUSTAINABILITY_SPECIALIST'
  | 'SPR_ENVIRONMENT_MANAGER';

type HomologyUser = {
  email: string;
  first: string;
  last: string;
  position: string;
  areaCode: string | null;
  /** Áreas adicionales en user_areas (p. ej. gerente multi-área). */
  extraAreaCodes?: readonly string[];
  companyCode: string;
  roles: readonly SprRole[];
  /** true = email inventado hasta confirmar con negocio. */
  provisionalEmail?: boolean;
};

const AREAS: ReadonlyArray<{ code: string; name: string }> = [
  { code: 'AREA-STECNICOS', name: 'Servicios Técnicos' },
  { code: 'AREA-OPTACTIVOS', name: 'Optimización de Activos' },
  { code: 'AREA-MINA', name: 'Mina' },
  { code: 'AREA-FINANZAS', name: 'Finanzas' },
  { code: 'AREA-PLANTA', name: 'Planta Procesos' },
  { code: 'AREA-MAMBIENTE', name: 'Medio Ambiente' },
  { code: 'AREA-SUSTENTABILIDAD', name: 'Sustentabilidad' },
  { code: 'AREA-SOPERACIONALES', name: 'Servicios Operacionales' },
  { code: 'AREA-SERVICIOS', name: 'Servicios Generales' },
];

const COMPANIES: ReadonlyArray<{ code: string; name: string; isContractor: boolean }> = [
  { code: 'CORP', name: 'Gold Fields', isContractor: false },
  { code: 'ENAEX', name: 'ENAEX', isContractor: true },
  { code: 'ICV', name: 'ICV S.A.', isContractor: true },
];

/**
 * Matriz homologada. Emails reales cuando la matriz los trae;
 * resto provisional (first.last@dominio).
 */
const USERS: readonly HomologyUser[] = [
  // —— Firmas SOX / reporte oficial ——
  {
    email: 'tgalarce@goldfields.com',
    first: 'Tania',
    last: 'Galarce',
    position: 'Especialista de Sustentabilidad (Elaboración SOX)',
    areaCode: 'AREA-SUSTENTABILIDAD',
    companyCode: 'CORP',
    roles: ['SPR_SUSTAINABILITY_SPECIALIST'],
  },
  {
    email: 'catalina.cortes@goldfields.com',
    first: 'Catalina',
    last: 'Cortés',
    position: 'Especialista de Sustentabilidad',
    areaCode: 'AREA-SUSTENTABILIDAD',
    companyCode: 'CORP',
    roles: ['SPR_SUSTAINABILITY_SPECIALIST'],
  },
  {
    email: 'elisa.gonzalez@goldfields.com',
    first: 'Elisa',
    last: 'González Belmar',
    position: 'Environmental Manager (Sign-off final SOX)',
    areaCode: 'AREA-MAMBIENTE',
    companyCode: 'CORP',
    roles: ['SPR_ENVIRONMENT_MANAGER'],
  },
  {
    email: 'gabriel.fuenzalida@goldfields.com',
    first: 'Gabriel',
    last: 'Fuenzalida',
    position: 'Gerente de Sustentabilidad y Cumplimiento',
    areaCode: 'AREA-SUSTENTABILIDAD',
    companyCode: 'CORP',
    roles: ['SPR_ENVIRONMENT_MANAGER'],
  },
  {
    email: 'anamaria.pintotorres@goldfields.com',
    first: 'Ana María',
    last: 'Pinto Torres',
    position: 'Analista Sustentabilidad (Reporte de Gastos)',
    areaCode: 'AREA-SUSTENTABILIDAD',
    companyCode: 'CORP',
    roles: ['SPR_RESPONSIBLE'],
  },

  // —— Servicios Técnicos ——
  {
    email: 'felipe.nunez@goldfields.com',
    first: 'Felipe',
    last: 'Núñez González',
    position: 'Superintendente de Aguas',
    areaCode: 'AREA-STECNICOS',
    companyCode: 'CORP',
    roles: ['SPR_RESPONSIBLE'],
    provisionalEmail: true,
  },
  {
    email: 'francisco.villalobos@goldfields.com',
    first: 'Francisco',
    last: 'Villalobos R.',
    position: 'Gerente de Área (Mina / Servicios Técnicos)',
    areaCode: 'AREA-STECNICOS',
    extraAreaCodes: ['AREA-MINA'],
    companyCode: 'CORP',
    roles: ['SPR_AREA_MANAGER'],
    provisionalEmail: true,
  },

  // —— Mina ——
  {
    email: 'luis.delso@goldfields.com',
    first: 'Luis',
    last: 'Delso Paredes',
    position: 'Superintendente de Operaciones Mina',
    areaCode: 'AREA-MINA',
    companyCode: 'CORP',
    roles: ['SPR_RESPONSIBLE'],
    provisionalEmail: true,
  },

  // —— Planta ——
  {
    email: 'pablo.salazar@goldfields.com',
    first: 'Pablo',
    last: 'Salazar G.',
    position: 'Responsable reporte SPR Planta',
    areaCode: 'AREA-PLANTA',
    companyCode: 'CORP',
    roles: ['SPR_RESPONSIBLE'],
    provisionalEmail: true,
  },
  {
    email: 'cristian.castro@goldfields.com',
    first: 'Cristian',
    last: 'Castro G.',
    position: 'Gerente de Planta',
    areaCode: 'AREA-PLANTA',
    companyCode: 'CORP',
    roles: ['SPR_AREA_MANAGER'],
    provisionalEmail: true,
  },

  // —— Optimización de Activos ——
  {
    email: 'ricardo.soto@goldfields.com',
    first: 'Ricardo',
    last: 'Soto',
    position: 'Ingeniero Eléctrico Senior',
    areaCode: 'AREA-OPTACTIVOS',
    companyCode: 'CORP',
    roles: ['SPR_RESPONSIBLE'],
    provisionalEmail: true,
  },
  {
    email: 'bruno.soto@goldfields.com',
    first: 'Bruno',
    last: 'Soto',
    position: 'Superintendente de Gestión de Activos',
    areaCode: 'AREA-OPTACTIVOS',
    companyCode: 'CORP',
    roles: ['SPR_AREA_MANAGER'],
    provisionalEmail: true,
  },

  // —— Finanzas ——
  {
    email: 'cristian.catalan@goldfields.com',
    first: 'Cristián',
    last: 'Catalán',
    position: 'Ingeniero Control de Gestión',
    areaCode: 'AREA-FINANZAS',
    companyCode: 'CORP',
    roles: ['SPR_RESPONSIBLE'],
    provisionalEmail: true,
  },
  {
    email: 'patricio.pinto@goldfields.com',
    first: 'Patricio',
    last: 'Pinto',
    position: 'Gerente de Finanzas',
    areaCode: 'AREA-FINANZAS',
    companyCode: 'CORP',
    roles: ['SPR_AREA_MANAGER'],
    provisionalEmail: true,
  },
  {
    email: 'francisco.budinich@goldfields.com',
    first: 'Francisco',
    last: 'Budinich',
    position: 'Equipo Gerencia Finanzas',
    areaCode: 'AREA-FINANZAS',
    companyCode: 'CORP',
    roles: ['SPR_RESPONSIBLE'],
    provisionalEmail: true,
  },
  {
    email: 'pablo.alvarez@goldfields.com',
    first: 'Pablo',
    last: 'Alvarez',
    position: 'Equipo Gerencia Finanzas',
    areaCode: 'AREA-FINANZAS',
    companyCode: 'CORP',
    roles: ['SPR_RESPONSIBLE'],
    provisionalEmail: true,
  },

  // —— SSGG → AREA-SERVICIOS ——
  {
    email: 'omar.hernandez@goldfields.com',
    first: 'Omar',
    last: 'Hernández',
    position: 'Responsable reporte SPR Servicios Generales',
    areaCode: 'AREA-SERVICIOS',
    companyCode: 'CORP',
    roles: ['SPR_RESPONSIBLE'],
    provisionalEmail: true,
  },
  {
    email: 'claudio.benitez@goldfields.com',
    first: 'Claudio',
    last: 'Benitez',
    position: 'Equipo Gerencia Sitio (SSGG)',
    areaCode: 'AREA-SERVICIOS',
    companyCode: 'CORP',
    roles: ['SPR_RESPONSIBLE'],
    provisionalEmail: true,
  },
  {
    email: 'melquisedec.diaz@goldfields.com',
    first: 'Melquisedec',
    last: 'Diaz',
    position: 'Equipo Gerencia Sitio (SSGG)',
    areaCode: 'AREA-SERVICIOS',
    companyCode: 'CORP',
    roles: ['SPR_RESPONSIBLE'],
    provisionalEmail: true,
  },
  {
    email: 'angelica.celis@goldfields.com',
    first: 'Angélica',
    last: 'Celis',
    position: 'Equipo Gerencia Sitio (SSGG)',
    areaCode: 'AREA-SERVICIOS',
    companyCode: 'CORP',
    roles: ['SPR_RESPONSIBLE'],
    provisionalEmail: true,
  },
  {
    email: 'caty.veas@goldfields.com',
    first: 'Caty',
    last: 'Veas',
    position: 'Equipo Gerencia Sitio (SSGG)',
    areaCode: 'AREA-SERVICIOS',
    companyCode: 'CORP',
    roles: ['SPR_RESPONSIBLE'],
    provisionalEmail: true,
  },

  // —— Medio Ambiente (residuos) ——
  {
    email: 'marjorie.yanez@goldfields.com',
    first: 'Marjorie Alejandra',
    last: 'Yáñez',
    position: 'Responsable Declaración SIDREP',
    areaCode: 'AREA-MAMBIENTE',
    companyCode: 'CORP',
    roles: ['SPR_RESPONSIBLE'],
  },

  // —— Contratistas ——
  {
    email: 'fabian.onate@enaex.com',
    first: 'Fabián',
    last: 'Oñate Miranda',
    position: 'Representante Técnico (Explosivos)',
    areaCode: 'AREA-MINA',
    companyCode: 'ENAEX',
    roles: ['SPR_RESPONSIBLE'],
    provisionalEmail: true,
  },
  {
    email: 'scampusano@icv.cl',
    first: 'Sergio',
    last: 'Campusano Guerra',
    position: 'Jefe de Bodega',
    areaCode: 'AREA-MINA',
    companyCode: 'ICV',
    roles: ['SPR_RESPONSIBLE'],
  },
  {
    email: 'svargas@icv.cl',
    first: 'Sofía',
    last: 'Vargas Roberts',
    position: 'Encargada SGI',
    areaCode: 'AREA-MINA',
    companyCode: 'ICV',
    roles: ['SPR_RESPONSIBLE'],
  },
];

/** Assignments parámetro→área (catálogo SPR actual). */
const ASSIGNMENTS: ReadonlyArray<{ parameterCode: string; areaCode: string }> = [
  { parameterCode: 'GROUNDWATER-FRESHWATER', areaCode: 'AREA-STECNICOS' },
  { parameterCode: 'VOLUME-RECYCLED-WATER', areaCode: 'AREA-STECNICOS' },
  { parameterCode: 'VOLUME-REUSED-WATER', areaCode: 'AREA-STECNICOS' },

  { parameterCode: 'DIESEL-HAULAGE-OTHER', areaCode: 'AREA-OPTACTIVOS' },
  { parameterCode: 'DIESEL-POWER-GENERATION', areaCode: 'AREA-OPTACTIVOS' },
  { parameterCode: 'DIESEL-PLANTS-ELECTRICITY', areaCode: 'AREA-OPTACTIVOS' },

  { parameterCode: 'BLASTING-AGENTS', areaCode: 'AREA-MINA' },
  { parameterCode: 'LPG-PROCESS', areaCode: 'AREA-MINA' },
  { parameterCode: 'ACETYLENE', areaCode: 'AREA-MINA' },
  { parameterCode: 'WASTE-ROCK-TO-DUMP', areaCode: 'AREA-MINA' },
  { parameterCode: 'HYDROCARBONS', areaCode: 'AREA-MINA' },

  { parameterCode: 'ENERGY-COST-DIESEL-USD', areaCode: 'AREA-FINANZAS' },
  { parameterCode: 'ENERGY-COST-ELECTRICITY-USD', areaCode: 'AREA-FINANZAS' },

  { parameterCode: 'CYANIDE', areaCode: 'AREA-PLANTA' },
  { parameterCode: 'HCL', areaCode: 'AREA-PLANTA' },
  { parameterCode: 'LIME', areaCode: 'AREA-PLANTA' },
  { parameterCode: 'CAUSTIC-SODA', areaCode: 'AREA-PLANTA' },
  { parameterCode: 'ACETYLENE', areaCode: 'AREA-PLANTA' },
  { parameterCode: 'TAILINGS-TO-DAMS', areaCode: 'AREA-PLANTA' },
  { parameterCode: 'CHEMICALS', areaCode: 'AREA-PLANTA' },

  { parameterCode: 'LPG-PROCESS', areaCode: 'AREA-SOPERACIONALES' },
  { parameterCode: 'ROAD-TRAVEL-INPUT', areaCode: 'AREA-SOPERACIONALES' },
  { parameterCode: 'SHORT-HAUL-FLIGHTS', areaCode: 'AREA-SOPERACIONALES' },
  { parameterCode: 'LONG-HAUL-FLIGHTS', areaCode: 'AREA-SOPERACIONALES' },
  { parameterCode: 'CHEMICALS', areaCode: 'AREA-SOPERACIONALES' },
  { parameterCode: 'HYDROCARBONS', areaCode: 'AREA-SOPERACIONALES' },
  { parameterCode: 'BRINE-PRECIPITATE', areaCode: 'AREA-SOPERACIONALES' },
  { parameterCode: 'GENERAL-LANDFILL', areaCode: 'AREA-SOPERACIONALES' },
  { parameterCode: 'OTHER-WASTE', areaCode: 'AREA-SOPERACIONALES' },

  { parameterCode: 'BATTERIES', areaCode: 'AREA-MAMBIENTE' },
  { parameterCode: 'WEIGHED-METAL', areaCode: 'AREA-MAMBIENTE' },
  { parameterCode: 'WEIGHED-PLASTIC', areaCode: 'AREA-MAMBIENTE' },
  { parameterCode: 'GENERAL-LANDFILL', areaCode: 'AREA-MAMBIENTE' },
  { parameterCode: 'HYDROCARBONS', areaCode: 'AREA-MAMBIENTE' },
  { parameterCode: 'CHEMICALS', areaCode: 'AREA-MAMBIENTE' },
  { parameterCode: 'BRINE-PRECIPITATE', areaCode: 'AREA-MAMBIENTE' },
  { parameterCode: 'INCIDENT-LEVEL-0', areaCode: 'AREA-MAMBIENTE' },
  { parameterCode: 'INCIDENT-LEVEL-3', areaCode: 'AREA-MAMBIENTE' },
  { parameterCode: 'INCIDENT-LEVEL-4', areaCode: 'AREA-MAMBIENTE' },
  { parameterCode: 'INCIDENT-LEVEL-5', areaCode: 'AREA-MAMBIENTE' },
  { parameterCode: 'INCIDENT-L1-RELEASE-AIR', areaCode: 'AREA-MAMBIENTE' },
  { parameterCode: 'INCIDENT-L1-LOSS-CONTAINMENT', areaCode: 'AREA-MAMBIENTE' },
  { parameterCode: 'INCIDENT-L1-LAND-DISTURBANCE', areaCode: 'AREA-MAMBIENTE' },
  { parameterCode: 'INCIDENT-L1-FAUNA-FLORA', areaCode: 'AREA-MAMBIENTE' },
  { parameterCode: 'INCIDENT-L1-WASTE-MGMT', areaCode: 'AREA-MAMBIENTE' },
  { parameterCode: 'INCIDENT-L1-BLASTING-VIBRATION', areaCode: 'AREA-MAMBIENTE' },
  { parameterCode: 'INCIDENT-L2-RELEASE-AIR', areaCode: 'AREA-MAMBIENTE' },
  { parameterCode: 'INCIDENT-L2-LOSS-CONTAINMENT', areaCode: 'AREA-MAMBIENTE' },
  { parameterCode: 'INCIDENT-L2-LAND-DISTURBANCE', areaCode: 'AREA-MAMBIENTE' },
  { parameterCode: 'INCIDENT-L2-FAUNA-FLORA', areaCode: 'AREA-MAMBIENTE' },
  { parameterCode: 'INCIDENT-L2-WASTE-MGMT', areaCode: 'AREA-MAMBIENTE' },
  { parameterCode: 'INCIDENT-L2-BLASTING-VIBRATION', areaCode: 'AREA-MAMBIENTE' },

  { parameterCode: 'POLLUTION-PREVENTION', areaCode: 'AREA-SUSTENTABILIDAD' },
  { parameterCode: 'AUDITS', areaCode: 'AREA-SUSTENTABILIDAD' },
  { parameterCode: 'SPECIALIST-STUDIES-EIAS', areaCode: 'AREA-SUSTENTABILIDAD' },
  { parameterCode: 'OTHER-OPEX', areaCode: 'AREA-SUSTENTABILIDAD' },
];

type ParamDef = {
  code: string;
  name: string;
  description: string;
  group: string;
  unit: string;
  sort: number;
  isSox?: boolean;
};

/** Definiciones mínimas para crear factores ausentes (ON CONFLICT DO NOTHING). */
const PARAMETERS: readonly ParamDef[] = [
  { code: 'GROUNDWATER-FRESHWATER', name: 'Ground Water: Freshwater (<5000) High quality', description: 'Agua dulce ST (SOX)', group: 'water', unit: 'mlt', sort: 100, isSox: true },
  { code: 'VOLUME-RECYCLED-WATER', name: 'Total Volume: Recycled Water (ML)', description: 'Agua reciclada ST (SOX)', group: 'water', unit: 'mlt', sort: 110, isSox: true },
  { code: 'VOLUME-REUSED-WATER', name: 'Total Volume: Reused Water (ML)', description: 'Agua reusada ST (SOX)', group: 'water', unit: 'mlt', sort: 120, isSox: true },
  { code: 'CYANIDE', name: 'Cyanide', description: 'Cianuro — Planta', group: 'reagents', unit: 'ton', sort: 10 },
  { code: 'HCL', name: 'HCl', description: 'Ácido clorhídrico — Planta', group: 'reagents', unit: 'ton', sort: 50 },
  { code: 'LIME', name: 'Lime', description: 'Cal — Planta', group: 'reagents', unit: 'ton', sort: 30 },
  { code: 'CAUSTIC-SODA', name: 'Caustic soda', description: 'Soda cáustica — Planta', group: 'reagents', unit: 'ton', sort: 40 },
  { code: 'ACETYLENE', name: 'Acetylene', description: 'Acetileno', group: 'reagents', unit: 'ton', sort: 60 },
  { code: 'TAILINGS-TO-DAMS', name: 'Tailings to dams - Calculated', description: 'Relaves a tranque', group: 'mining_materials', unit: 'ton', sort: 70 },
  { code: 'BLASTING-AGENTS', name: 'Blasting agents', description: 'Explosivos — Mina', group: 'explosives', unit: 'ton', sort: 20 },
  { code: 'LPG-PROCESS', name: 'Gas for Process (LPG)', description: 'LPG proceso', group: 'reagents', unit: 'ton', sort: 80 },
  { code: 'WASTE-ROCK-TO-DUMP', name: 'Waste rock to dump - Weighed', description: 'Waste rock', group: 'mining_materials', unit: 'ton', sort: 90 },
  { code: 'DIESEL-HAULAGE-OTHER', name: 'Diesel: Haulage and Other', description: 'Diesel haulage', group: 'fuel', unit: 'klt', sort: 200 },
  { code: 'DIESEL-POWER-GENERATION', name: 'Diesel: Power Generation', description: 'Diesel generación', group: 'fuel', unit: 'klt', sort: 210 },
  { code: 'DIESEL-PLANTS-ELECTRICITY', name: 'Diesel Plants Electricity Generated', description: 'Electricidad diesel', group: 'electricity', unit: 'mwh', sort: 220 },
  { code: 'ENERGY-COST-DIESEL-USD', name: 'Energy Costs: Diesel in USD', description: 'Costo diesel', group: 'energy_costs', unit: 'usd', sort: 230 },
  { code: 'ENERGY-COST-ELECTRICITY-USD', name: 'Energy Costs: Electricity in USD', description: 'Costo electricidad', group: 'energy_costs', unit: 'usd', sort: 240 },
  { code: 'ROAD-TRAVEL-INPUT', name: 'Road Travel Input', description: 'Km terrestres', group: 'transport', unit: 'km', sort: 250 },
  { code: 'SHORT-HAUL-FLIGHTS', name: 'Short Haul Flights Input (<3700 km)', description: 'Vuelos short haul', group: 'transport', unit: 'km', sort: 260 },
  { code: 'LONG-HAUL-FLIGHTS', name: 'Long Haul Flights', description: 'Vuelos long haul', group: 'transport', unit: 'km', sort: 270 },
  { code: 'CHEMICALS', name: 'Chemicals (packaging/expired)', description: 'Químicos', group: 'waste', unit: 'ton', sort: 300 },
  { code: 'HYDROCARBONS', name: 'Hydrocarbons (oil, grease)', description: 'Hidrocarburos', group: 'waste', unit: 'ton', sort: 310 },
  { code: 'BRINE-PRECIPITATE', name: 'Brine Precipitate', description: 'Brine precipitate', group: 'waste', unit: 'ton', sort: 320 },
  { code: 'GENERAL-LANDFILL', name: 'Weighed: General Landfill', description: 'Relleno sanitario', group: 'waste', unit: 'ton', sort: 330 },
  { code: 'OTHER-WASTE', name: 'Other (Brine, packaging, sludge)', description: 'Otros residuos', group: 'waste', unit: 'ton', sort: 340 },
  { code: 'BATTERIES', name: 'Batteries', description: 'Baterías', group: 'waste', unit: 'ton', sort: 350 },
  { code: 'WEIGHED-METAL', name: 'Weighed: Metal', description: 'Metal pesado', group: 'waste', unit: 'ton', sort: 360 },
  { code: 'WEIGHED-PLASTIC', name: 'Weighed: Plastic', description: 'Plástico pesado', group: 'waste', unit: 'ton', sort: 370 },
  { code: 'INCIDENT-LEVEL-0', name: 'Level 0', description: 'Incidente L0', group: 'compliance', unit: 'count', sort: 400 },
  { code: 'INCIDENT-LEVEL-3', name: 'Level 3', description: 'Incidente L3', group: 'compliance', unit: 'count', sort: 430 },
  { code: 'INCIDENT-LEVEL-4', name: 'Level 4', description: 'Incidente L4', group: 'compliance', unit: 'count', sort: 440 },
  { code: 'INCIDENT-LEVEL-5', name: 'Level 5', description: 'Incidente L5', group: 'compliance', unit: 'count', sort: 450 },
  { code: 'INCIDENT-L1-RELEASE-AIR', name: 'Level 1 - Release to air', description: 'L1 aire', group: 'compliance', unit: 'count', sort: 401 },
  { code: 'INCIDENT-L1-LOSS-CONTAINMENT', name: 'Level 1 - Loss of containment', description: 'L1 contención', group: 'compliance', unit: 'count', sort: 402 },
  { code: 'INCIDENT-L1-LAND-DISTURBANCE', name: 'Level 1 - Land disturbance', description: 'L1 suelo', group: 'compliance', unit: 'count', sort: 403 },
  { code: 'INCIDENT-L1-FAUNA-FLORA', name: 'Level 1 - Impact on fauna and flora', description: 'L1 fauna', group: 'compliance', unit: 'count', sort: 404 },
  { code: 'INCIDENT-L1-WASTE-MGMT', name: 'Level 1 - Waste management or disposal', description: 'L1 residuos', group: 'compliance', unit: 'count', sort: 405 },
  { code: 'INCIDENT-L1-BLASTING-VIBRATION', name: 'Level 1 - Blasting and vibration', description: 'L1 voladura', group: 'compliance', unit: 'count', sort: 406 },
  { code: 'INCIDENT-L2-RELEASE-AIR', name: 'Level 2 - Release to air', description: 'L2 aire', group: 'compliance', unit: 'count', sort: 411 },
  { code: 'INCIDENT-L2-LOSS-CONTAINMENT', name: 'Level 2 - Loss of containment', description: 'L2 contención', group: 'compliance', unit: 'count', sort: 412 },
  { code: 'INCIDENT-L2-LAND-DISTURBANCE', name: 'Level 2 - Land disturbance', description: 'L2 suelo', group: 'compliance', unit: 'count', sort: 413 },
  { code: 'INCIDENT-L2-FAUNA-FLORA', name: 'Level 2 - Impact on fauna and flora', description: 'L2 fauna', group: 'compliance', unit: 'count', sort: 414 },
  { code: 'INCIDENT-L2-WASTE-MGMT', name: 'Level 2 - Waste management or disposal', description: 'L2 residuos', group: 'compliance', unit: 'count', sort: 415 },
  { code: 'INCIDENT-L2-BLASTING-VIBRATION', name: 'Level 2 - Blasting and vibration', description: 'L2 voladura', group: 'compliance', unit: 'count', sort: 416 },
  { code: 'POLLUTION-PREVENTION', name: 'Pollution prevention', description: 'Prevención contaminación', group: 'sustainability_opex', unit: 'usd', sort: 500 },
  { code: 'AUDITS', name: 'Audits', description: 'Auditorías', group: 'sustainability_opex', unit: 'usd', sort: 510 },
  { code: 'SPECIALIST-STUDIES-EIAS', name: 'Specialist Studies and EIAs', description: 'Estudios EIAs', group: 'sustainability_opex', unit: 'usd', sort: 520 },
  { code: 'OTHER-OPEX', name: 'Other Operational Expenditure', description: 'Otro opex', group: 'sustainability_opex', unit: 'usd', sort: 530 },
];

async function createPasswordHash(secret: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await deriveKey(secret, salt, ITERATIONS, KEY_LENGTH, 'sha256');
  return `${FORMAT}$${ITERATIONS}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

async function assignRoles(qr: QueryRunner, email: string, roleCodes: readonly string[]): Promise<void> {
  await qr.query(
    `INSERT INTO user_roles (user_id, role_id)
     SELECT u.id, r.id
     FROM users u
     INNER JOIN roles r ON r.code = ANY($2::text[]) AND r.is_active = true
     WHERE u.email = $1
     ON CONFLICT DO NOTHING`,
    [email, roleCodes],
  );
}

async function ensureOrg(qr: QueryRunner): Promise<void> {
  await qr.query(
    `INSERT INTO gerencias (code, name, status)
     VALUES ('GER-OPS', 'Gerencia de Operaciones', 'active')
     ON CONFLICT (code) DO NOTHING`,
  );

  for (const area of AREAS) {
    await qr.query(
      `INSERT INTO areas (code, name, status)
       VALUES ($1, $2, 'active')
       ON CONFLICT (code) DO NOTHING`,
      [area.code, area.name],
    );
  }

  for (const company of COMPANIES) {
    await qr.query(
      `INSERT INTO companies (code, name, is_contractor, status)
       VALUES ($1, $2, $3, 'active')
       ON CONFLICT (code) DO NOTHING`,
      [company.code, company.name, company.isContractor],
    );
  }
}

async function ensureCatalog(qr: QueryRunner): Promise<void> {
  await qr.query(`
    INSERT INTO spr_units (code, name, symbol, status)
    VALUES
      ('unit', 'Unidad', 'un', 'active'),
      ('count', 'Cantidad', null, 'active'),
      ('percent', 'Porcentaje', '%', 'active'),
      ('m3', 'Metro cúbico', 'm³', 'active'),
      ('kg', 'Kilogramo', 'kg', 'active'),
      ('ton', 'Tonelada', 't', 'active'),
      ('kwh', 'Kilowatt hora', 'kWh', 'active'),
      ('klt', 'Kilolitro', 'KLT', 'active'),
      ('mwh', 'Megawatt hora', 'MWh', 'active'),
      ('usd', 'Dólar estadounidense', 'USD', 'active'),
      ('mlt', 'Megalitro', 'MLT', 'active'),
      ('km', 'Kilómetro', 'km', 'active'),
      ('clp', 'Peso chileno', 'CLP', 'active')
    ON CONFLICT (code) DO NOTHING
  `);

  await qr.query(`
    INSERT INTO spr_measure_groups (code, name, description, sort_order, status)
    VALUES
      ('water', 'Agua', 'Consumo y captación de agua', 1, 'active'),
      ('waste', 'Residuos', 'Residuos peligrosos y no peligrosos', 2, 'active'),
      ('energy', 'Energía', 'Consumo energético', 3, 'active'),
      ('emissions', 'Emisiones', 'Emisiones y reportabilidad', 4, 'active'),
      ('compliance', 'Cumplimiento', 'Incidentes y cumplimiento', 5, 'active'),
      ('reagents', 'Reactivos y gases de proceso', 'Cianuro, ácidos, cal, soda, acetileno, LPG', 10, 'active'),
      ('explosives', 'Explosivos', 'Agentes de voladura', 20, 'active'),
      ('fuel', 'Combustibles diesel', 'Consumo diesel por uso', 30, 'active'),
      ('electricity', 'Electricidad generada', 'Generación eléctrica asociada a diesel', 40, 'active'),
      ('energy_costs', 'Costos de energía', 'Costos en USD', 50, 'active'),
      ('transport', 'Transporte', 'Kilometraje y vuelos', 60, 'active'),
      ('mining_materials', 'Materiales mineros', 'Relaves y waste rock', 70, 'active'),
      ('sustainability_opex', 'Opex sustentabilidad', 'Gastos de sustentabilidad', 80, 'active')
    ON CONFLICT (code) DO NOTHING
  `);

  for (const parameter of PARAMETERS) {
    await qr.query(
      `
      INSERT INTO spr_parameters
        (measure_group_id, unit_id, code, name, description, is_sox, requires_evidence, value_type, sort_order, status)
      SELECT g.id, u.id, $1, $2, $3, $4, false, 'numeric', $5, 'active'
      FROM spr_measure_groups g
      JOIN spr_units u ON u.code = $6
      WHERE g.code = $7
      ON CONFLICT (code) DO NOTHING
      `,
      [
        parameter.code,
        parameter.name,
        parameter.description,
        parameter.isSox ?? false,
        parameter.sort,
        parameter.unit,
        parameter.group,
      ],
    );
  }

  for (const assignment of ASSIGNMENTS) {
    await qr.query(
      `
      INSERT INTO spr_parameter_area_assignments (parameter_id, area_id, status)
      SELECT p.id, a.id, 'active'
      FROM spr_parameters p
      JOIN areas a ON a.code = $2
      WHERE p.code = $1
      ON CONFLICT ON CONSTRAINT uq_spr_assignment_parameter_area DO NOTHING
      `,
      [assignment.parameterCode, assignment.areaCode],
    );
  }

  // Espejo SSGG: mismos factores de SOPERACIONALES → SERVICIOS (código AREA-SERVICIOS).
  await qr.query(`
    INSERT INTO spr_parameter_area_assignments (parameter_id, area_id, status)
    SELECT spa.parameter_id, serv.id, 'active'
    FROM spr_parameter_area_assignments spa
    INNER JOIN areas sop ON sop.id = spa.area_id AND sop.code = 'AREA-SOPERACIONALES'
    INNER JOIN areas serv ON serv.code = 'AREA-SERVICIOS'
    WHERE spa.status = 'active'
    ON CONFLICT ON CONSTRAINT uq_spr_assignment_parameter_area DO NOTHING
  `);
}

async function upsertUser(qr: QueryRunner, user: HomologyUser, passwordHash: string): Promise<void> {
  await qr.query(
    `
    INSERT INTO users (
      email, first_name, last_name, position, is_active,
      password_hash, password_changed_at, failed_login_attempts, locked_until
    )
    VALUES ($1, $2, $3, $4, true, $5, NOW(), 0, NULL)
    ON CONFLICT (email) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      position = EXCLUDED.position,
      is_active = true,
      password_hash = EXCLUDED.password_hash,
      password_changed_at = EXCLUDED.password_changed_at,
      failed_login_attempts = 0,
      locked_until = NULL,
      updated_at = NOW()
    `,
    [user.email, user.first, user.last, user.position, passwordHash],
  );

  if (user.areaCode) {
    await qr.query(
      `
      UPDATE users u
      SET area_id = a.id
      FROM areas a
      WHERE u.email = $1 AND a.code = $2
      `,
      [user.email, user.areaCode],
    );
  }

  await assignRoles(qr, user.email, user.roles);

  await qr.query(
    `
    INSERT INTO user_companies (user_id, company_id)
    SELECT u.id, c.id
    FROM users u, companies c
    WHERE u.email = $1 AND c.code = $2
    ON CONFLICT DO NOTHING
    `,
    [user.email, user.companyCode],
  );

  const areaCodes = [user.areaCode, ...(user.extraAreaCodes ?? [])].filter(Boolean) as string[];
  for (const areaCode of areaCodes) {
    await qr.query(
      `
      INSERT INTO user_areas (user_id, area_id)
      SELECT u.id, a.id
      FROM users u
      INNER JOIN areas a ON a.code = $2
      WHERE u.email = $1
      ON CONFLICT DO NOTHING
      `,
      [user.email, areaCode],
    );
  }
}

/** Enlaza responsible/approver en assignments por área (si aún están null). */
async function linkAssignmentActors(qr: QueryRunner): Promise<void> {
  const links: Array<{ areaCode: string; responsibleEmail: string; approverEmail: string }> = [
    {
      areaCode: 'AREA-STECNICOS',
      responsibleEmail: 'felipe.nunez@goldfields.com',
      approverEmail: 'francisco.villalobos@goldfields.com',
    },
    {
      areaCode: 'AREA-OPTACTIVOS',
      responsibleEmail: 'ricardo.soto@goldfields.com',
      approverEmail: 'bruno.soto@goldfields.com',
    },
    {
      areaCode: 'AREA-MINA',
      responsibleEmail: 'luis.delso@goldfields.com',
      approverEmail: 'francisco.villalobos@goldfields.com',
    },
    {
      areaCode: 'AREA-PLANTA',
      responsibleEmail: 'pablo.salazar@goldfields.com',
      approverEmail: 'cristian.castro@goldfields.com',
    },
    {
      areaCode: 'AREA-FINANZAS',
      responsibleEmail: 'cristian.catalan@goldfields.com',
      approverEmail: 'patricio.pinto@goldfields.com',
    },
    {
      areaCode: 'AREA-SERVICIOS',
      responsibleEmail: 'omar.hernandez@goldfields.com',
      approverEmail: 'omar.hernandez@goldfields.com',
    },
    {
      areaCode: 'AREA-MAMBIENTE',
      responsibleEmail: 'marjorie.yanez@goldfields.com',
      approverEmail: 'elisa.gonzalez@goldfields.com',
    },
    {
      areaCode: 'AREA-SUSTENTABILIDAD',
      responsibleEmail: 'anamaria.pintotorres@goldfields.com',
      approverEmail: 'gabriel.fuenzalida@goldfields.com',
    },
  ];

  for (const link of links) {
    await qr.query(
      `
      UPDATE spr_parameter_area_assignments spa
      SET
        responsible_user_id = COALESCE(spa.responsible_user_id, resp.id),
        approver_user_id = COALESCE(spa.approver_user_id, appr.id),
        updated_at = NOW()
      FROM areas a
      LEFT JOIN users resp ON resp.email = $2
      LEFT JOIN users appr ON appr.email = $3
      WHERE spa.area_id = a.id
        AND a.code = $1
        AND spa.status = 'active'
      `,
      [link.areaCode, link.responsibleEmail, link.approverEmail],
    );
  }
}

export async function runSprHomologyUsersSeed(ds: DataSource): Promise<void> {
  const passwordHash = await createPasswordHash(DEMO_PASSWORD);
  const qr = ds.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    await ensureOrg(qr);
    await ensureCatalog(qr);

    let provisional = 0;
    for (const user of USERS) {
      if (user.provisionalEmail) provisional += 1;
      await upsertUser(qr, user, passwordHash);
    }

    await linkAssignmentActors(qr);

    // Homologación: el especialista canónico es tgalarce@ (email real).
    // Quitar rol SPR_SUSTAINABILITY_SPECIALIST del email demo legado si existe.
    await qr.query(
      `
      DELETE FROM user_roles ur
      USING users u, roles r
      WHERE ur.user_id = u.id
        AND ur.role_id = r.id
        AND u.email = 'tania.galarce@goldfields.com'
        AND r.code = 'SPR_SUSTAINABILITY_SPECIALIST'
      `,
    );

    await qr.commitTransaction();

    console.log(
      `SPR homology seed OK: ${USERS.length} users upserted (${provisional} provisional emails). Password: ${DEMO_PASSWORD}`,
    );
  } catch (error) {
    await qr.rollbackTransaction();
    throw error;
  } finally {
    await qr.release();
  }
}

async function main(): Promise<void> {
  const ds = await AppDataSource.initialize();
  try {
    await runSprHomologyUsersSeed(ds);
  } finally {
    await ds.destroy();
  }
}

if (require.main === module) {
  void main().catch((err) => {
    console.error('SPR homology seed failed:', err);
    process.exit(1);
  });
}
