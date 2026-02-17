/**
 * Swagger Detector - Detects Swagger UI specific fields
 */

export interface SwaggerContext {
  isSwaggerPage: boolean;
  hasCodeMirror: boolean;
  hasMonaco: boolean;
  swaggerVersion?: string;
}

/**
 * Detect if current page is Swagger UI
 */
export function detectSwaggerPage(): SwaggerContext {
  const context: SwaggerContext = {
    isSwaggerPage: false,
    hasCodeMirror: false,
    hasMonaco: false,
  };

  // Check for Swagger UI indicators
  const swaggerIndicators = [
    document.querySelector('.swagger-ui'),
    document.querySelector('[id*="swagger"]'),
    document.querySelector('[class*="swagger"]'),
    window.location.pathname.includes('swagger'),
    window.location.pathname.includes('api-docs'),
    window.location.pathname.includes('/docs'),
  ];

  context.isSwaggerPage = swaggerIndicators.some(indicator => Boolean(indicator));

  // Check for CodeMirror
  context.hasCodeMirror = Boolean(document.querySelector('.CodeMirror'));

  // Check for Monaco
  context.hasMonaco = Boolean(document.querySelector('.monaco-editor'));

  // Try to detect Swagger version
  const swaggerContainer = document.querySelector('.swagger-ui');
  if (swaggerContainer) {
    const versionMatch = swaggerContainer.getAttribute('data-swagger-version');
    if (versionMatch) {
      context.swaggerVersion = versionMatch;
    }
  }

  return context;
}

/**
 * Detect Swagger UI specific input fields
 */
export function detectSwaggerFields(root: Element = document.body): HTMLElement[] {
  const fields: HTMLElement[] = [];

  // Swagger UI parameter inputs
  const parameterInputs = root.querySelectorAll(
    '.swagger-ui input[type="text"], ' +
    '.swagger-ui textarea, ' +
    '.parameters input, ' +
    '.parameters textarea'
  );

  parameterInputs.forEach((element) => {
    if (element instanceof HTMLElement) {
      fields.push(element);
    }
  });

  // Request body editors
  const requestBodyEditors = root.querySelectorAll(
    '.body-param textarea, ' +
    '.body-param__text, ' +
    '[data-param-name] textarea'
  );

  requestBodyEditors.forEach((element) => {
    if (element instanceof HTMLElement) {
      fields.push(element);
    }
  });

  return fields;
}

/**
 * Detect if element is inside Swagger UI request body area
 */
export function isSwaggerRequestBody(element: HTMLElement): boolean {
  const parent = element.closest('.body-param, .body-param__text, [class*="request-body"]');
  return Boolean(parent);
}
