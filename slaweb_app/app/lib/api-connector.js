/* global ic, io, $ */
import Ember from 'ember';

import ajax from './ajax';
import {concatUrl} from './misc';
import config from 'slameter/config/environment';

var session;

/**
 * Builds API url from base url, api root segment and passed final url part.
 * @param url - url of api service
 * @returns {string} - url
 */
function buildApiUrl(url) {
    var apiUrl = concatUrl(config.APP.BASE_URLS.base, config.APP.BASE_URLS.apiRoot) + '/',
        urlParts = url.split('?'), queryParams;

    url = urlParts[0];
    queryParams = urlParts.length > 1 ?urlParts[1] : null;

    if (url.indexOf(apiUrl) !== -1) {
        // url is already absolute, return it
        return (url.charAt(url.length-1) === '/' ? url : url + '/') + (queryParams ? '?' + queryParams : '');
    }

    url = url.replace(/^\//g, '');  // remove leading slash

    return apiUrl + (url.charAt(url.length-1) === '/' ? url : url + '/') + (queryParams ? '?' + queryParams : '');
}

/**
 * Makes API request with ajax.
 * @param url - API url (relative to api root)
 * @param [data] - data to send with request
 * @param [type] - type of request
 * @returns {Promise} - promise of eventually resolved request
 */
function apiAjax(url, data, type) {
    var options = {
        url: buildApiUrl(url),
        type: typeof type === 'string'? type : typeof data === 'object' && !type? 'POST' : type? type.toUpperCase() : 'GET',
        data: JSON.stringify(data),
        dataType: 'json',
        contentType: 'application/json'
    };

    if (config.APP.LOG.LOG_API_REQUESTS) {
        Ember.Logger.log('Ajax API request', options);
    }

    return ajax(options).catch(function(error){
        var exception = {
                type: error.errorThrown
            },
            responseText;

        if (error.jqXHR && error.jqXHR.responseText) {
            try {
                responseText = JSON.parse(error.jqXHR.responseText);
            } catch (e) {
                // responseText was set as HTML and could not be parsed
            }
            if (responseText) {
                exception.message = responseText.detail;
            }
        }
        //TODO spracovanie ajax api chyby
        return Ember.RSVP.reject(exception);
    }, 'catch error for apiAjax');
}

/**
 * Wrapper api call.
 * For potential use of other transport means.
 */
function apiCall(url, data, type) {
    var transport = apiAjax;
    return transport(url, data, type);
}



export {apiAjax, apiCall,buildApiUrl};
