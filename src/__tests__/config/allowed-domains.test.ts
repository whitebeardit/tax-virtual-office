import { describe, it, expect } from "@jest/globals";
import { isAllowedDomain, validateUrl } from "../../config/allowed-domains.js";

describe("allowed-domains", () => {
  it("should allow CGIBS URLs", () => {
    const url = "https://www.cgibs.gov.br/central-de-conteudo";
    expect(isAllowedDomain(url)).toBe(true);
    expect(validateUrl(url).valid).toBe(true);
  });

  it("should allow only the Pré-CGIBS Looker report paths", () => {
    const allowed =
      "https://lookerstudio.google.com/u/0/reporting/dd2797fa-da7a-4a28-beb9-1584c0330d1e/page/p_pzv4ek8lwd";
    expect(validateUrl(allowed).valid).toBe(true);

    const otherReport =
      "https://lookerstudio.google.com/u/0/reporting/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/page/p_test";
    const otherValidation = validateUrl(otherReport);
    expect(otherValidation.valid).toBe(false);
    expect(otherValidation.error || "").toMatch(/permitida apenas para caminhos/i);

    const prefixBypass =
      "https://lookerstudio.google.com/u/0/reporting/dd2797fa-da7a-4a28-beb9-1584c0330d1eFAKE/page/p_test";
    expect(validateUrl(prefixBypass).valid).toBe(false);
  });
});

