(function () {
    angular.module('i18n.over.rest', ['config', 'rest.client', 'notifications'])
        .factory('iorMessageReader', ['config', '$http', I18nMessageReaderFactory])
        .factory('iorMessageWriter', ['config', 'restServiceHandler', I18nMessageWriterFactory]);

    function I18nMessageReaderFactory(config, $http) {
        return function (ctx, onSuccess, onError) {
            var requestConfig = {};
            if (ctx.locale) requestConfig.headers = {'Accept-Language': ctx.locale};
            $http.get((config.baseUri || '') + 'api/i18n/translate?' +
            (ctx.namespace ? 'namespace=' + ctx.namespace + '&' : '') +
            'key=' + encodeURIComponent(ctx.code), requestConfig)
                .success(function (it) {
                    if (onSuccess) onSuccess(it)
                })
                .error(function () {
                    if (onError) onError();
                });
        }
    }

    function I18nMessageWriterFactory(config, restServiceHandler) {
        return function (ctx, presenter) {
            var payload = {
                locale: ctx.locale,
                key: ctx.key,
                message: ctx.message
            };
            if (ctx.namespace) payload.namespace = ctx.namespace;

            presenter.params = {
                method: 'POST',
                url: (config.baseUri || '') + 'api/i18n/translate',
                data: payload,
                withCredentials: true
            };
            if (ctx.locale) presenter.params.headers = {'accept-language': ctx.locale};
            restServiceHandler(presenter);
        }
    }
})();
