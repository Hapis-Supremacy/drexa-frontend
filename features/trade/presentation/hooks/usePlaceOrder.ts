import { useMutation } from "@tanstack/react-query";
import { placeOrder } from "../../model/order";

export function usePlaceOrder() {
  return useMutation({
    mutationFn: async (args: Parameters<typeof placeOrder>[0]) => {
      const res = await placeOrder(args);
      window.dispatchEvent(new Event("wallet-refresh"));
      return res;
    },
  });
}