/**
 * Utility to ensure proper initialization in Squarespace environments
 * Addresses issues with dropdowns not working immediately after page load
 */

// Extend window interface for Squarespace
interface SquarespaceWindow extends Window {
  Static?: {
    SQUARESPACE_CONTEXT?: unknown;
  };
  Y?: {
    Squarespace?: unknown;
  };
}

export class SquarespaceInitializer {
  private static instance: SquarespaceInitializer | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): SquarespaceInitializer {
    if (!SquarespaceInitializer.instance) {
      SquarespaceInitializer.instance = new SquarespaceInitializer();
    }
    return SquarespaceInitializer.instance;
  }

  /**
   * Initialize Squarespace compatibility features
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.performInitialization();
    await this.initPromise;
    this.initialized = true;
  }

  private async performInitialization(): Promise<void> {
    // Only run in Squarespace environments
    if (!this.isSquarespaceEnvironment()) {
      return;
    }

    // Initializing Squarespace compatibility mode

    // 1. Wait for DOM to be fully ready
    await this.waitForDOM();

    // 2. Force layout recalculation to ensure proper positioning
    this.forceLayoutRecalculation();

    // 3. Set up mutation observer to handle dynamic Squarespace changes
    this.setupMutationObserver();

    // 4. Apply immediate fixes
    this.applyImmediateFixes();

    // 5. Set up periodic check for the first 10 seconds
    this.setupPeriodicCheck();

    // Squarespace compatibility mode initialized
  }

  private isSquarespaceEnvironment(): boolean {
    if (typeof window === 'undefined') return false;
    
    return !!(
      window.location.hostname.includes('squarespace.com') ||
      window.location.hostname.includes('sqsp.net') ||
      document.querySelector('[data-squarespace-site]') ||
      document.querySelector('.sqs-layout') ||
      (window as SquarespaceWindow).Static?.SQUARESPACE_CONTEXT ||
      (window as SquarespaceWindow).Y?.Squarespace
    );
  }

  private async waitForDOM(): Promise<void> {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', () => resolve(), { once: true });
      }
    });
  }

  private forceLayoutRecalculation(): void {
    // Force browser to recalculate layout
    const root = document.getElementById('root');
    if (root) {
      root.style.display = 'none';
      root.offsetHeight; // Force reflow
      root.style.display = '';
    }
  }

  private setupMutationObserver(): void {
    const observer = new MutationObserver((mutations) => {
      // Check if Squarespace is modifying our app container
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && 
            (mutation.target as HTMLElement).id === 'root') {
          // Reapply our fixes if Squarespace modifies our root
          this.applyImmediateFixes();
        }
      }
    });

    const root = document.getElementById('root');
    if (root) {
      observer.observe(root, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    }
  }

  private applyImmediateFixes(): void {
    // 1. Ensure root has proper attributes
    const root = document.getElementById('root');
    if (root) {
      root.setAttribute('data-shipping-calculator', 'true');
      root.style.position = 'relative';
      root.style.zIndex = '1';
    }

    // 2. Create portal container if it doesn't exist
    if (!document.getElementById('select-portal-container')) {
      const portalContainer = document.createElement('div');
      portalContainer.id = 'select-portal-container';
      portalContainer.className = 'squarespace-select-portal';
      portalContainer.style.cssText = `
        position: fixed;
        z-index: 999999;
        pointer-events: none;
      `;
      document.body.appendChild(portalContainer);
    }

    // 3. Fix any existing select triggers
    const selectTriggers = document.querySelectorAll('[role="combobox"]');
    selectTriggers.forEach((trigger) => {
      const element = trigger as HTMLElement;
      element.style.position = 'relative';
      element.style.zIndex = '2';
    });
  }

  private setupPeriodicCheck(): void {
    let checkCount = 0;
    const maxChecks = 20; // Check for 10 seconds (20 * 500ms)
    
    const intervalId = setInterval(() => {
      checkCount++;
      
      // Apply fixes periodically during Squarespace initialization
      this.applyImmediateFixes();
      
      // Check if dropdowns are working
      const hasWorkingDropdowns = this.checkDropdownsFunctionality();
      
      if (hasWorkingDropdowns || checkCount >= maxChecks) {
        clearInterval(intervalId);
        // Dropdowns initialized
      }
    }, 500);
  }

  private checkDropdownsFunctionality(): boolean {
    // Check if any select portals are rendered
    const portals = document.querySelectorAll('[data-radix-portal]');
    return portals.length > 0;
  }

  /**
   * Force re-initialization (useful for debugging)
   */
  async reinitialize(): Promise<void> {
    this.initialized = false;
    this.initPromise = null;
    await this.initialize();
  }
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  SquarespaceInitializer.getInstance().initialize().catch(() => {
    // Initialization error handled silently
  });
}

export default SquarespaceInitializer;
