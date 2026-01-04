
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

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // 关键修正：将代理路径 /api/proxy/xxx 映射为 Google 的 /xxx
    const targetPath = url.pathname.startsWith('/api/proxy') 
      ? url.pathname.slice('/api/proxy'.length) 
      : url.pathname;
    
    // 确保路径以 /v1 开头
    const finalPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
    const targetUrl = `https://generativelanguage.googleapis.com${finalPath}${url.search}`;

    const headers = new Headers(req.headers);
    headers.set('Host', 'generativelanguage.googleapis.com');
    // 移除导致校验失败的元信息
    headers.delete('Origin');
    headers.delete('Referer');

    // 处理请求体：对于 POST 请求，直接透传 body 流
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: headers,
      redirect: 'follow'
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = req.body;
      // @ts-ignore
      fetchOptions.duplex = 'half';
    }

    const response = await fetch(targetUrl, fetchOptions);

    // 重新封装响应头，确保跨域许可被注入
    const responseHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });
    
    // 安全：删除 Google 可能下发的 CSP 限制
    responseHeaders.delete('content-security-policy');

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Proxy Gateway Failure', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
