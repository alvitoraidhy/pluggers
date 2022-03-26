import assert from "assert";
import Plugger from "../src/index";

describe("Core functions test", () => {
  describe("Plugger(name: string)", () => {
    it("should create an instance without a problem", () => {
      const name = "plugin";

      assert.doesNotThrow(() => {
        new Plugger(name);
      });
    });

    describe("#getName()", () => {
      it("should return the instance's name", () => {
        const name = "very cool name";

        const instance = new Plugger(name);

        assert.strictEqual(instance.getName(), name);
      });
    });
  });
});
