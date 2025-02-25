import { z } from "zod";

const baselayerInputSchema = z.object({
  name: z.string({ message: "Name: Expected a string" }),
  collection: z.string({ message: "Collection: Expected a string" }),
  description: z.string({ message: "Description: Expected a string" }),
  args: z.array(z.string({ message: "Args: Expected an array of strings" })),
  params: z.array(
    z.string({ message: "Params: Expected an array of strings" })
  ),
});

interface LayerInput extends z.infer<typeof baselayerInputSchema> {
  include?: (LayerInput | string)[];
}

const layerInputSchema = baselayerInputSchema.extend({
  include: z.array(baselayerInputSchema).or(z.string()).optional(),
});

export { layerInputSchema, type LayerInput };
