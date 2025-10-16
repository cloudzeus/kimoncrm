/**
 * Product Field Mapping between Database and SoftOne ERP
 * This provides bidirectional mapping for product data
 */

export interface DatabaseProduct {
  // Basic Info
  id?: string;
  mtrl?: string | null;
  code?: string | null;
  code1?: string | null; // EAN
  code2?: string | null; // Manufacturer Code
  name: string;
  
  // Relations (IDs)
  brandId: string;
  categoryId: string;
  manufacturerId?: string | null;
  unitId?: string | null;
  
  // Dimensions & Weight
  width?: number | null;
  length?: number | null;
  height?: number | null;
  weight?: number | null;
  
  // Status
  isActive: boolean;
  
  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SoftOneProduct {
  // Authentication & Company
  username: string;
  password: string;
  company: number;
  sodtype: number;
  
  // Basic Info
  MTRL?: string;
  CODE: string;
  CODE1?: string; // EAN
  CODE2?: string; // Manufacturer Code
  NAME: string;
  
  // Relations (Codes/IDs from related tables)
  MTRMARK?: number; // Brand ID (not code!)
  MTRCATEGORY?: number; // Category code (just the number, e.g., 7)
  MTRMANFCTR?: string; // Manufacturer code
  MTRUNIT1?: number; // Unit code (101)
  MTRUNIT2?: number;
  MTRUNIT3?: number;
  MTRUNIT4?: number;
  
  // Dimensions & Weight
  DIM1?: string; // Width in cm
  DIM2?: string; // Length in cm
  DIM3?: string; // Height in cm
  WEIGHT?: string; // Weight in kg
  DIMMD?: string;
  DIMMTRUNIT?: string;
  
  // Status
  ISACTIVE: string; // '1' or '0'
  
  // Standard Fields
  MTRTYPE?: string;
  MTRTYPE1?: string;
  CRDCARDMODE?: string;
  MTRGASTYPE?: string;
  MTRACN?: number;
  VAT?: number;
  MU21?: string;
  MU31?: string;
  MU41?: string;
  SOCURRENCY?: string;
  KEPYO?: string;
  MUMD?: string;
  VOLUME?: string;
  PRICEW?: string;
  PRICER?: string;
  MARKUPW?: string;
  MARKUPR?: string;
  REMAINMODE?: string;
  ACNMSK?: string;
  ACNMSK1?: string;
  ACNMSK6?: string;
  SALQTY?: string;
  PURQTY?: string;
  ITEQTY?: string;
  FROMVAL?: string;
  SODISCOUNT?: string;
  SODISCOUNT1?: string;
  SODISCOUNT2?: string;
  MAXPRCDISC?: string;
  MINPRCMK?: string;
  CHKMAXPRCDISC?: string;
  CALCONCREDIT?: string;
  REPLPUR?: string;
  REPLSAL?: string;
  REPLITE?: string;
  AUTOUPDPUR?: string;
  AUTOUPDSAL?: string;
  AUTOUPDITE?: string;
  PRINTPURMD?: string;
  PRINTSALMD?: string;
  PRINTITEMD?: string;
  UNIQSUB?: string;
  MTRLOTUSE?: string;
  MTRSNUSE?: string;
  ISTOTSRVCARD?: string;
  MTRTHIRD?: string;
  USESTBIN?: string;
  MTRONORDER?: string;
  TURNOVR?: string;
  REPLPRICE?: string;
  REPLEXP?: string;
  REMAINLIMMIN?: string;
  REMAINLIMMAX?: string;
  REORDERLEVEL?: string;
  EXPVAL1?: string;
  EXPVAL2?: string;
  EXPVAL3?: string;
  EXPVAL4?: string;
  EXPVAL5?: string;
  EXPVAL6?: string;
  EXPVAL7?: string;
  EXPVAL8?: string;
  VISITNUM?: string;
  HASBAIL?: string;
  MYDATACODE?: string;
  DISCOPTION?: string;
  NODISCOPTION?: string;
}

export interface RelatedCodes {
  brandId: number; // Brand ID for MTRMARK
  categoryCode: number; // Just the category number (e.g., 7)
  manufacturerCode?: string;
  unitCode: number; // Just the unit number (e.g., 101)
}

/**
 * Map database product to SoftOne ERP format for createNewItem
 * Uses simplified format matching the API requirements
 */
export function mapToSoftOne(
  product: DatabaseProduct,
  relatedCodes: RelatedCodes,
  credentials: { username: string; password: string; company: number }
): any {
  const payload: any = {
    // Authentication
    username: credentials.username,
    password: credentials.password,
    company: credentials.company,
    
    // Basic Info (required)
    CODE: product.code || '',
    NAME: product.name,
    MTRUNIT1: relatedCodes.unitCode,
    VAT: 1410,
    PRICER: 0,
    REMARKS: 'Created via AI Product Research',
  };

  // Add optional fields only if they have values
  if (product.code1) payload.CODE1 = product.code1;
  if (product.code2) payload.CODE2 = product.code2;
  if (relatedCodes.brandId) payload.MTRMARK = relatedCodes.brandId;
  if (relatedCodes.categoryCode) payload.MTRCATEGORY = relatedCodes.categoryCode;
  if (relatedCodes.manufacturerCode) payload.MTRMANFCTR = relatedCodes.manufacturerCode;
  
  // Dimensions & Weight (only if provided)
  if (product.width) payload.DIM1 = product.width.toString();
  if (product.length) payload.DIM2 = product.length.toString();
  if (product.height) payload.DIM3 = product.height.toString();
  if (product.weight) payload.WEIGHT = product.weight.toString();
  
  // Status
  if (product.isActive !== undefined) {
    payload.ISACTIVE = product.isActive ? '1' : '0';
  }

  return payload;
}

/**
 * Map SoftOne ERP product to database format
 */
export function mapFromSoftOne(
  softoneProduct: any,
  relatedIds: {
    brandId: string;
    categoryId: string;
    manufacturerId?: string;
    unitId: string;
  }
): Partial<DatabaseProduct> {
  return {
    mtrl: softoneProduct.MTRL || null,
    code: softoneProduct.CODE || null,
    code1: softoneProduct.CODE1 || null,
    code2: softoneProduct.CODE2 || null,
    name: softoneProduct.NAME,
    brandId: relatedIds.brandId,
    categoryId: relatedIds.categoryId,
    manufacturerId: relatedIds.manufacturerId || null,
    unitId: relatedIds.unitId,
    width: softoneProduct.DIM1 ? parseFloat(softoneProduct.DIM1) : null,
    length: softoneProduct.DIM2 ? parseFloat(softoneProduct.DIM2) : null,
    height: softoneProduct.DIM3 ? parseFloat(softoneProduct.DIM3) : null,
    weight: softoneProduct.WEIGHT ? parseFloat(softoneProduct.WEIGHT) : null,
    isActive: softoneProduct.ISACTIVE === '1',
  };
}

/**
 * Field mapping reference
 */
export const FIELD_MAPPING = {
  // Database -> SoftOne
  toSoftOne: {
    id: 'MTRL',
    mtrl: 'MTRL',
    code: 'CODE',
    code1: 'CODE1', // EAN
    code2: 'CODE2', // Manufacturer Code
    name: 'NAME',
    brandId: 'MTRMARK', // Requires code lookup
    categoryId: 'MTRCATEGORY', // Requires code lookup
    manufacturerId: 'MTRMANFCTR', // Requires code lookup
    unitId: 'MTRUNIT1', // Requires code lookup
    width: 'DIM1',
    length: 'DIM2',
    height: 'DIM3',
    weight: 'WEIGHT',
    isActive: 'ISACTIVE',
  },
  
  // SoftOne -> Database
  fromSoftOne: {
    MTRL: 'mtrl',
    CODE: 'code',
    CODE1: 'code1',
    CODE2: 'code2',
    NAME: 'name',
    MTRMARK: 'brandId', // Requires ID lookup
    MTRCATEGORY: 'categoryId', // Requires ID lookup
    MTRMANFCTR: 'manufacturerId', // Requires ID lookup
    MTRUNIT1: 'unitId', // Requires ID lookup
    DIM1: 'width',
    DIM2: 'length',
    DIM3: 'height',
    WEIGHT: 'weight',
    ISACTIVE: 'isActive',
  },
} as const;
