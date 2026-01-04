
export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, x-goog-api-key, x-goog-api-client, authorization',
    'Access-Control-Max-Age': '86400',
  };

  // 1. 处理浏览器的 CORS 预检请求（这是解决免 VPN 跨域的关键）
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // 提取 API 路径，保持 /v1beta/... 等结构完整
    const targetPath = url.pathname.replace(/^\/api\/proxy/, '');
    const targetUrl = `https://generativelanguage.googleapis.com${targetPath}${url.search}`;

    // 2. 深度伪装请求头
    const headers = new Headers(req.headers);
    headers.set('Host', 'generativelanguage.googleapis.com');
    headers.delete('Origin');
    headers.delete('Referer');

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      // @ts-ignore - Edge Runtime 必须设置此项以支持流式传输
      duplex: 'half',
    });

    // 3. 将 Google 的响应透传，并注入 CORS 许可
    const responseHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });
    // 移除可能引起浏览器安全拦截的限制
    responseHeaders.delete('content-security-policy');

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Proxy Gateway Error', msg: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
