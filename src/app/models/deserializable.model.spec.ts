import {Deserializable} from "./deserializable.model";

describe("Deserializable.Model", () => {
  it("accepts a structural implementation", () => {
    const value: Deserializable = {
      deserialize(_input: any) {
        return this;
      },
    };
    expect(value.deserialize({})).toBe(value);
  });
});
