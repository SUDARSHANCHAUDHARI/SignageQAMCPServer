import { describe, expect, it } from "vitest";
import { isBlockedHost } from "../src/services/header.service.js";

describe("isBlockedHost", () => {
  it("blocks localhost targets", () => {
    expect(isBlockedHost("localhost")).toBe(true);
    expect(isBlockedHost("127.0.0.1")).toBe(true);
    expect(isBlockedHost("::1")).toBe(true);
    expect(isBlockedHost("device.local")).toBe(true);
  });

  it("allows public hostnames", () => {
    expect(isBlockedHost("example.com")).toBe(false);
    expect(isBlockedHost("screencloud.com")).toBe(false);
  });
});
