import axios from "axios";

export default async function handler(req, res) {
  const pathSegments = req.query.path || [];
  const pathStr = Array.isArray(pathSegments) ? pathSegments.join("/") : pathSegments;

  const queryIndex = req.url.indexOf("?");
  const queryStr = queryIndex !== -1 ? req.url.substring(queryIndex) : "";

  const originBase = "http://143.44.136.110:6910/";
  const targetUrl = `${originBase}${pathStr}${queryStr}`;

  console.log(`Proxy fetching: ${targetUrl}`);

  try {
    const response = await axios.get(targetUrl, {
      responseType: "arraybuffer",
    });

    res.setHeader("Access-Control-Allow-Origin", "*");

    if (pathStr.endsWith(".mpd")) {
      let mpdXml = response.data.toString();

      const originalBase = "http://143.44.136.110:6910/";
      const proxyBase = `${req.headers["x-forwarded-proto"]}://${req.headers.host}/api/proxy/`;

      mpdXml = mpdXml.replace(
        new RegExp(originalBase, "g"),
        proxyBase
      );

      res.setHeader("Content-Type", "application/dash+xml");
      return res.send(mpdXml);
    }

    res.setHeader("Content-Type", response.headers["content-type"]);
    return res.send(response.data);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Proxy error");
  }
}
