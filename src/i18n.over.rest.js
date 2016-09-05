(function () {
    angular.module('i18n.over.rest', ['config', 'rest.client', 'notifications'])
        .factory('iorMessageReader', ['config', '$http', I18nMessageReaderFactory])
        .factory('iorMessageWriter', ['config', 'restServiceHandler', I18nMessageWriterFactory]);

    function I18nMessageReaderFactory(config, $http) {
        return function (ctx, onSuccess, onError) {
            $http({
                method: 'POST',
                url: config.baseUri + 'api/usecase',
                data: {
                    headers: {
                        usecase: 'resolve.i18n.message',
                        namespace: ctx.namespace,
                        locale: ctx.locale,
                        section: ctx.section
                    },
                    payload: {
                        key: ctx.code
                    }
                }
            }).then(function (it) {
                if (onSuccess) onSuccess(it.data.message)
            }, function () {
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
