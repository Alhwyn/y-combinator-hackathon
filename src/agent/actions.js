import logger from '../lib/logger.js';

/**
 * Action handlers for Playwright
 * Each action type has its own handler function
 */

export class ActionHandler {
  constructor(page) {
    this.page = page;
  }

  async execute(action) {
    const { type, ...params } = action;
    
    logger.info(`Executing action: ${type}`, { action });
    
    switch (type) {
      case 'navigate':
        return await this.navigate(params);
      case 'click':
        return await this.click(params);
      case 'fill':
        return await this.fill(params);
      case 'select':
        return await this.select(params);
      case 'wait':
        return await this.wait(params);
      case 'scroll':
        return await this.scroll(params);
      case 'hover':
        return await this.hover(params);
      case 'press':
        return await this.press(params);
      case 'assert':
        return await this.assert(params);
      case 'screenshot':
        return await this.screenshot(params);
      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  async navigate({ target, waitUntil = 'load' }) {
    await this.page.goto(target, { waitUntil });
    return { success: true, url: this.page.url() };
  }

  async click({ selector, button = 'left', clickCount = 1, delay = 0 }) {
    await this.page.click(selector, { button, clickCount, delay });
    return { success: true, selector };
  }

  async fill({ selector, value, delay = 0 }) {
    await this.page.fill(selector, value, { delay });
    return { success: true, selector, value: value.substring(0, 50) + '...' };
  }

  async select({ selector, values }) {
    const selectedValues = await this.page.selectOption(selector, values);
    return { success: true, selector, selectedValues };
  }

  async wait({ selector, timeout = 30000, state = 'visible' }) {
    if (selector) {
      await this.page.waitForSelector(selector, { timeout, state });
      return { success: true, selector, state };
    } else {
      await this.page.waitForTimeout(timeout);
      return { success: true, timeout };
    }
  }

  async scroll({ selector, behavior = 'smooth' }) {
    if (selector) {
      await this.page.locator(selector).scrollIntoViewIfNeeded();
      return { success: true, selector };
    } else {
      await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      return { success: true, scrolled: 'to bottom' };
    }
  }

  async hover({ selector, timeout = 30000 }) {
    await this.page.hover(selector, { timeout });
    return { success: true, selector };
  }

  async press({ key, selector = null }) {
    if (selector) {
      await this.page.locator(selector).press(key);
    } else {
      await this.page.keyboard.press(key);
    }
    return { success: true, key };
  }

  async assert({ selector, expected, assertType = 'text' }) {
    let actual;
    
    switch (assertType) {
      case 'text':
        actual = await this.page.locator(selector).textContent();
        break;
      case 'value':
        actual = await this.page.locator(selector).inputValue();
        break;
      case 'visible':
        actual = await this.page.locator(selector).isVisible();
        break;
      case 'count':
        actual = await this.page.locator(selector).count();
        break;
      case 'attribute':
        const attr = expected.attribute;
        actual = await this.page.locator(selector).getAttribute(attr);
        expected = expected.value;
        break;
      default:
        throw new Error(`Unknown assert type: ${assertType}`);
    }
    
    const passed = assertType === 'visible' || assertType === 'count'
      ? actual === expected
      : actual?.includes(expected) || actual === expected;
    
    if (!passed) {
      throw new Error(
        `Assertion failed: Expected "${expected}" but got "${actual}"`
      );
    }
    
    return { success: true, assertType, expected, actual };
  }

  async screenshot({ fullPage = false, path = null }) {
    const screenshot = await this.page.screenshot({
      fullPage,
      path,
      type: 'png'
    });
    return { success: true, screenshot };
  }

  async captureScreenshot(quality = 80) {
    const screenshot = await this.page.screenshot({
      type: 'jpeg',
      quality,
    });
    return screenshot;
  }
}

export default ActionHandler;

