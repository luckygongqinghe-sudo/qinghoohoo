
export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const url = new URL(req.url);
  
  // 提取原始请求路径并拼接到 Google API 域名
  // 例如：/api/proxy/v1beta/models/... -> https://generativelanguage.googleapis.com/v1beta/models/...
  const targetPath = url.pathname.replace(/^\/api\/proxy/, '');
  const targetUrl = `https://generativelanguage.googleapis.com${targetPath}${url.search}`;

  // 复制原始请求头，但需要覆盖 Host 确保 SSL 握手成功
  const headers = new Headers(req.headers);
  headers.set('Host', 'generativelanguage.googleapis.com');
  // 移除可能导致冲突的 origin 头部
  headers.delete('origin');
  headers.delete('referer');

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.blob() : undefined,
    });

    // 创建新的响应头，注入 CORS 允许
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE, PUT');
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, x-goog-api-key, x-goog-api-client');

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Proxy Request Failed', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
