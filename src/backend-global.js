exports.httpHandler = {
  endpoints: [
    {
      scope: "global",
      method: "GET",
      path: "getProjectProperty",
      handle: function handle(ctx) {
        ctx.response.json({
          projectActiveObject: ctx.globalStorage.extensionProperties.projectActiveObject || "{}"
        });
      }
    },
    {
      scope: 'global',
      method: 'POST',
      path: 'setProjectProperty',
      handle: function handle(ctx) {
        try {
          const body = ctx.request.json();
          // Store in both globalStorage (for reading) and project (as in original code)
          ctx.globalStorage.extensionProperties.projectActiveObject = body.projectActiveObject;

          ctx.response.json({
            success: true,
            projectActiveObject: ctx.globalStorage.extensionProperties.projectActiveObject
          });
        } catch (error) {
          ctx.response.json({
            success: false,
            error: String(error)
          });
        }
      }
    }
  ]
};