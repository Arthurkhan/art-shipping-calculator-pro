import {
  calculateDimensionalWeight,
  getBilledWeight,
  calculateVolume,
  formatDimensions
} from './dimension-calculator';
import {
  formatLocation,
  getFormattedShipDate,
  formatNumberWithCommas,
  formatWeight,
  formatCurrency
} from './preview-formatter';

interface CollectionSize {
  weight_kg: number;
  height_cm: number;
  length_cm: number;
  width_cm: number;
}

interface PreviewParams {
  sizeData: CollectionSize;
  collectionName: string;
  size: string;
  country: string;
  postalCode: string;
  originCountry: string;
  originPostalCode: string;
  preferredCurrency: string;
}

export interface PreviewSection {
  title: string;
  icon: string;
  color: string;
  items: Array<{
    label: string;
    value: string;
    highlight?: boolean;
  }>;
}

/**
 * Builds collection and size preview section
 */
export const buildCollectionSection = (params: PreviewParams): PreviewSection => {
  return {
    title: 'Collection & Size',
    icon: 'Package',
    color: 'blue',
    items: [
      {
        label: 'Collection',
        value: params.collectionName
      },
      {
        label: 'Size',
        value: params.size
      },
      {
        label: 'Number of boxes',
        value: '1'
      }
    ]
  };
};

/**
 * Builds shipping route preview section
 */
export const buildShippingRouteSection = (params: PreviewParams): PreviewSection => {
  return {
    title: 'Shipping Route',
    icon: 'Globe',
    color: 'green',
    items: [
      {
        label: 'From',
        value: formatLocation(params.originCountry, params.originPostalCode)
      },
      {
        label: 'To',
        value: formatLocation(params.country, params.postalCode)
      },
      {
        label: 'Ship Date',
        value: getFormattedShipDate()
      }
    ]
  };
};

/**
 * Builds dimensions preview section
 */
export const buildDimensionsSection = (params: PreviewParams): PreviewSection => {
  return {
    title: 'Dimensions (CM)',
    icon: 'Calculator',
    color: 'purple',
    items: [
      {
        label: 'Length',
        value: `${params.sizeData.length_cm} cm`
      },
      {
        label: 'Width',
        value: `${params.sizeData.width_cm} cm`
      },
      {
        label: 'Height',
        value: `${params.sizeData.height_cm} cm`
      },
      {
        label: 'Total',
        value: formatDimensions(params.sizeData)
      }
    ]
  };
};

/**
 * Builds weight calculation preview section
 */
export const buildWeightSection = (params: PreviewParams): PreviewSection => {
  const dimensionalWeight = calculateDimensionalWeight(params.sizeData);
  const billedWeight = getBilledWeight(params.sizeData);
  
  return {
    title: 'Weight Calculation',
    icon: 'Package',
    color: 'orange',
    items: [
      {
        label: 'Actual Weight',
        value: formatWeight(params.sizeData.weight_kg)
      },
      {
        label: 'Dimensional Weight',
        value: formatWeight(dimensionalWeight)
      },
      {
        label: 'Billed Weight',
        value: formatWeight(billedWeight),
        highlight: true
      },
      {
        label: '',
        value: '(Higher of actual or dimensional weight)'
      }
    ]
  };
};

/**
 * Builds FedEx API parameters preview section
 */
export const buildFedexApiSection = (params: PreviewParams): PreviewSection => {
  return {
    title: 'FedEx API Parameters',
    icon: 'MapPin',
    color: 'indigo',
    items: [
      {
        label: 'Preferred Currency',
        value: formatCurrency(params.preferredCurrency),
        highlight: true
      },
      {
        label: 'Pickup Type',
        value: 'DROPOFF_AT_FEDEX_LOCATION'
      },
      {
        label: 'Packaging Type',
        value: 'YOUR_PACKAGING'
      },
      {
        label: 'Rate Request Types',
        value: 'LIST, ACCOUNT, INCENTIVE'
      },
      {
        label: 'Group Package Count',
        value: '1'
      },
      {
        label: 'Weight Units',
        value: 'KG'
      }
    ]
  };
};

/**
 * Builds debug information section
 */
export const buildDebugSection = (params: PreviewParams, collection: string): any => {
  const volume = calculateVolume(params.sizeData);
  
  return {
    collectionId: collection,
    volume: formatNumberWithCommas(volume),
    dimFactor: '5000 (FedEx standard for CM/KG)',
    shipDate: `${getFormattedShipDate()} (Tomorrow)`,
    currencySource: 'User-selected (not auto-mapped)'
  };
};

/**
 * Builds all preview sections
 */
export const buildPreviewSections = (params: PreviewParams): PreviewSection[] => {
  return [
    buildCollectionSection(params),
    buildShippingRouteSection(params),
    buildDimensionsSection(params),
    buildWeightSection(params),
    buildFedexApiSection(params)
  ];
};

/**
 * Builds formatted preview data
 */
export const buildPreviewData = (params: PreviewParams, collection: string) => {
  return {
    sections: buildPreviewSections(params),
    debug: buildDebugSection(params, collection),
    currency: {
      selected: formatCurrency(params.preferredCurrency),
      source: 'User-controlled',
      note: 'You can test different currencies to see which ones FedEx supports for your route.'
    }
  };
};