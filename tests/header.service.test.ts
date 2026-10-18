import { describe, expect, it } from "vitest";
import { isBlockedHost } from "../src/services/header.service.js";

describe("isBlockedHost", () => {
  it("blocks localhost targets", () => {
    expect(isBlockedHost("localhost")).toBe(true);
    expect(isBlockedHost("127.0.0.1")).toBe(true);
    expect(isBlockedHost("::1")).toBe(true);
    expect(isBlockedHost("device.local")).toBe(true);
  });

  it("blocks private, link-local, CGNAT and internal targets", () => {
    for (const host of ["[::1]", "169.254.169.254", "10.0.0.5", "172.16.0.1", "192.168.1.1", "100.64.0.1", "0.0.0.0", "[::ffff:7f00:1]", "[fd00::1]", "[fe80::1]", "metadata.google.internal"]) {
      expect(isBlockedHost(host), host).toBe(true);
    }
  });

  it("allows public hostnames", () => {
    expect(isBlockedHost("example.com")).toBe(false);
    expect(isBlockedHost("public-signage.example")).toBe(false);
  });
});
