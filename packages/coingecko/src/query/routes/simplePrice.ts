import { JSON } from "@web3api/wasm-as";

import { COINGECKO_API_URL } from "../config";
import { boolToString } from "../utils";
import {
  HTTP_Query,
  HTTP_ResponseType,
  HTTP_UrlParam,
  Input_simplePrice,
  SimplePrice,
  SimplePriceData,
} from "../w3";

export function simplePrice(input: Input_simplePrice): SimplePrice[] {
  const urlParams: Array<HTTP_UrlParam> = [
    { key: "ids", value: input.ids.join(",") },
    { key: "vs_currencies", value: input.vs_currencies.join(",") },
    { key: "include_market_cap", value: boolToString(input.include_market_cap) },
    { key: "include_24hr_vol", value: boolToString(input.include_24hr_vol) },
    { key: "include_24hr_change", value: boolToString(input.include_24hr_change) },
    { key: "include_last_updated_at", value: boolToString(input.include_last_updated_at) },
  ];

  const response = HTTP_Query.get({
    url: COINGECKO_API_URL + "/simple/price",
    request: {
      headers: [],
      urlParams: urlParams,
      body: "",
      responseType: HTTP_ResponseType.TEXT,
    },
  });
  if (!response || response.status !== 200 || !response.body) {
    throw Error(response.statusText);
  }

  const ids = input.ids;
  const vs_currencies = input.vs_currencies;

  const json = <JSON.Obj>JSON.parse(response.body);
  const simplePrices: SimplePrice[] = [];
  for (let i = 0; i < ids.length; i++) {
    const rawPriceData = json.getObj(ids[i]);
    if (rawPriceData) {
      const priceDatas: SimplePriceData[] = [];
      for (let j = 0; j < vs_currencies.length; j++) {
        const currency = vs_currencies[j];
        const price = rawPriceData.getFloat(currency);
        if (price) {
          const market_cap = rawPriceData.getFloat(currency + "_market_cap");
          const vol_24h = rawPriceData.getFloat(currency + "_24h_vol");
          const change_24h = rawPriceData.getFloat(currency + "_24h_change");
          priceDatas.push({
            vs_currency: currency,
            price: price.valueOf().toString(),
            market_cap: market_cap ? market_cap.valueOf().toString() : null,
            vol_24h: vol_24h ? vol_24h.valueOf().toString() : null,
            change_24h: change_24h ? change_24h.valueOf().toString() : null,
          });
        }
      }
      const last_updated_at = rawPriceData.getInteger("last_updated_at");
      simplePrices.push({
        id: ids[i],
        price_data: priceDatas,
        last_updated_at: last_updated_at ? last_updated_at.valueOf().toString() : null,
      });
    }
  }
  return simplePrices;
}
