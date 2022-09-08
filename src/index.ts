import axios from "axios";

import { load } from "cheerio";
import { SELECTORS } from "./constants/selectors";
import { URLS } from "./constants/urls";

const ACCESS_TOKEN = "A4R3nbOaJv98yWb4OrsLwZuBGM-GFBfQlD2WDRTVCj11WgAAAYMd1Q8b";

type ExchangeRatesAsNumberArray = [number, number, number];

const SHOULD_BUY_PERCENT = 1.004;
const SHOULD_SELL_PERCENT = 0.996;

function shouldNotify(exchangeRatesAsNumberArray: ExchangeRatesAsNumberArray) {
  return (
    shouldBuy(exchangeRatesAsNumberArray) ||
    shouldSell(exchangeRatesAsNumberArray)
  );
}

function shouldBuy([investing, hana, sinhan]: ExchangeRatesAsNumberArray) {
  if (investing / hana > SHOULD_BUY_PERCENT) return true;

  if (investing / sinhan > SHOULD_BUY_PERCENT) return true;

  return false;
}

function shouldSell([investing, hana, sinhan]: ExchangeRatesAsNumberArray) {
  if (investing / hana < SHOULD_SELL_PERCENT) return true;

  if (investing / sinhan < SHOULD_SELL_PERCENT) return true;

  return false;
}

function getTitle(exchangeRatesAsNumberArray: ExchangeRatesAsNumberArray) {
  if (shouldBuy(exchangeRatesAsNumberArray)) {
    return "구매";
  }

  if (shouldSell(exchangeRatesAsNumberArray)) {
    return "판매";
  }

  return "환율";
}

function formatExchangeRate([
  investing,
  hana,
  sinhan,
]: ExchangeRatesAsNumberArray) {
  return "인베스팅: " + investing + " 하나: " + hana + " 신한: " + sinhan;
}

async function scrapping() {
  const exchangeRates = await scrapDollarWon();

  const exchangeRatesAsNumberArray = exchangeRates.map((exchangeRate) =>
    parseFloat(exchangeRate.replace(/,/g, ""))
  ) as [number, number, number];

  // if (shouldNotify(exchangeRatesAsNumberArray)) {
  postMessage({
    title: getTitle(exchangeRatesAsNumberArray),
    description: formatExchangeRate(exchangeRatesAsNumberArray),
  });
  // }
}

function fetchInvestingData() {
  return axios.get(URLS.INVESTING);
}

function fetchHana() {
  return axios.get(URLS.HANA);
}

function fetchSinHan() {
  return axios.get(URLS.SINHAN);
}

function postMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return axios
    .post(
      "https://kapi.kakao.com/v2/api/talk/memo/default/send",
      "template_object=" +
        JSON.stringify({
          object_type: "feed",
          content: {
            title,
            description,
            image_url: "",
            image_width: 0,
            image_height: 0,
            link: {
              web_url: "",
              mobile_web_url: "",
              android_execution_params: "contentId=100",
              ios_execution_params: "contentId=100",
            },
          },
        }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      }
    )
    .catch((error) => console.log(error));
}

function scrapDollarWon() {
  return Promise.all([
    fetchInvestingData()
      .then(({ data }) => load(data))
      .then(($) => $(SELECTORS.INVESTING).text()),
    fetchHana()
      .then(({ data }) => load(data))
      .then(($) => $(SELECTORS.HANA).text()),
    fetchSinHan()
      .then(({ data }) => load(data))
      .then(($) => $(SELECTORS.SINHAN).text()),
  ]);
}

scrapping();
