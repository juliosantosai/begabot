class FetchHttpClient {
  async enviar(request) {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(request.body),
    });

    return {
      ok: response.ok,
      status: response.status,
      data: await response.text(),
    };
  }
}

module.exports = FetchHttpClient;
