/**
 * Sample test cases for the Multi-Agent Browser Testing System
 * Import this file and use createTestCase from testHelpers.js to add these to the database
 */

export const sampleTests = [
  {
    name: "Google Search Test",
    description: "Test basic Google search functionality",
    url: "https://www.google.com",
    actions: [
      {
        type: "navigate",
        target: "https://www.google.com"
      },
      {
        type: "wait",
        selector: "textarea[name='q']",
        timeout: 5000
      },
      {
        type: "fill",
        selector: "textarea[name='q']",
        value: "Playwright automation"
      },
      {
        type: "press",
        key: "Enter"
      },
      {
        type: "wait",
        selector: "#search",
        timeout: 10000
      },
      {
        type: "assert",
        selector: "#search",
        assertType: "visible",
        expected: true
      }
    ],
    priority: 10,
    tags: ["smoke", "search"]
  },
  
  {
    name: "Example.com Navigation Test",
    description: "Simple navigation test to example.com",
    url: "https://example.com",
    actions: [
      {
        type: "navigate",
        target: "https://example.com"
      },
      {
        type: "wait",
        selector: "h1",
        timeout: 5000
      },
      {
        type: "assert",
        selector: "h1",
        assertType: "text",
        expected: "Example Domain"
      },
      {
        type: "screenshot",
        fullPage: true
      }
    ],
    priority: 5,
    tags: ["smoke", "navigation"]
  },
  
  {
    name: "GitHub Homepage Test",
    description: "Test GitHub homepage elements",
    url: "https://github.com",
    actions: [
      {
        type: "navigate",
        target: "https://github.com"
      },
      {
        type: "wait",
        selector: "header",
        timeout: 10000
      },
      {
        type: "assert",
        selector: "header",
        assertType: "visible",
        expected: true
      },
      {
        type: "scroll",
        selector: "footer"
      },
      {
        type: "wait",
        timeout: 2000
      },
      {
        type: "screenshot",
        fullPage: true
      }
    ],
    priority: 7,
    tags: ["visual", "navigation"]
  },
  
  {
    name: "HTTP Bin Form Test",
    description: "Test form submission with httpbin.org",
    url: "https://httpbin.org/forms/post",
    actions: [
      {
        type: "navigate",
        target: "https://httpbin.org/forms/post"
      },
      {
        type: "wait",
        selector: "form",
        timeout: 5000
      },
      {
        type: "fill",
        selector: "input[name='custname']",
        value: "Test User"
      },
      {
        type: "fill",
        selector: "input[name='custtel']",
        value: "1234567890"
      },
      {
        type: "fill",
        selector: "input[name='custemail']",
        value: "test@example.com"
      },
      {
        type: "select",
        selector: "select[name='size']",
        values: ["medium"]
      },
      {
        type: "click",
        selector: "input[value='bacon']"
      },
      {
        type: "fill",
        selector: "textarea[name='comments']",
        value: "This is a test comment from automated testing"
      },
      {
        type: "screenshot"
      }
    ],
    priority: 8,
    tags: ["form", "input"]
  }
];

export default sampleTests;

