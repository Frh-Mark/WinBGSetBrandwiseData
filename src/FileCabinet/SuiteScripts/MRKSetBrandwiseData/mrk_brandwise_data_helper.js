/**
 * @NApiVersion 2.1
 */
define(['N/log', 'N/record', 'N/runtime', 'N/search'],
    /**
     * @param{log} log
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     */
    (log, record, runtime, search) => {
        let scriptParams = {};

        const CONSTANTS = {
            FIELDS: {
                CANCELDATE: 'custbody_canc_by_ship_date',
                ORDERDATE: 'createddate',
                TOTAL: 'total',
                SHIPPINGCOST: 'shippingcost',
                SHIPMETHOD: 'shipmethod',
                SUBSIDIARY: 'subsidiary',
                CLASS: 'class'
            },
 
            SCRIPT: {
                UE: {
                    SCRIPT_ID: 'customscript_mrk_brandwise_set_data_ue',
                    DEPLOYMENT_ID: 'customdeploy_mrk_brandwise_set_data_ue',
                    PARAMS: {
                        BRANDWISE_CLASS: 'custscript_mrk_brndwise_class',
                        SUBSIDIARY: 'custscript_mrk_brandwise_subsidiary'
                    }
                }
            }
        }
        const HELPERS = {
            getParams: () => {
                if (!!scriptParams && Object.keys(scriptParams).length > 0) return scriptParams;
                let scriptId = runtime.getCurrentScript().id;
                let PARAMS = {};
                switch (scriptId) {
                    case CONSTANTS.SCRIPT.UE.SCRIPT_ID:
                        PARAMS = CONSTANTS.SCRIPT.UE.PARAMS;
                        break;
                }
                Object.keys(PARAMS).forEach(key => {
                    scriptParams[key] = runtime.getCurrentScript().getParameter(PARAMS[key])
                });
                return scriptParams;
            },

            setBrandwiseOrderFields: (context) => {
                try {
                    let tranRecord = record.load({
                        type: record.Type.SALES_ORDER,
                        id: context.newRecord.id
                    });
                    let subsidiary = tranRecord.getValue(CONSTANTS.FIELDS.SUBSIDIARY);
                    let soClass = tranRecord.getValue(CONSTANTS.FIELDS.CLASS);
                  
                    let isBrandwiseOrder = false;
                    let params = HELPERS.getParams();
                    log.debug('setBrandwiseOrderFields', 'params: ' + JSON.stringify(params));

                    // if Sales order is from Brandwise && subsidiary is Homesick
                    if (soClass == params.BRANDWISE_CLASS && subsidiary == params.SUBSIDIARY) {
                        isBrandwiseOrder = true;
                    }
                    if (!!isBrandwiseOrder) {
                        log.debug('setBrandwiseOrderFields', 'isBrandwiseOrder: ' + isBrandwiseOrder);
                        let cancelDate = tranRecord.getValue(CONSTANTS.FIELDS.CANCELDATE);
                        log.debug('setBrandwiseOrderFields', 'cancelDate: ' + cancelDate);
                        let transactionTotal = tranRecord.getValue(CONSTANTS.FIELDS.TOTAL);
                        let shipMethod = tranRecord.getValue(CONSTANTS.FIELDS.SHIPMETHOD);
                        // Set Cancel Date if empty
                        if (!cancelDate) {
                            let orderDate = tranRecord.getValue(CONSTANTS.FIELDS.ORDERDATE);
                            let cancelDateToSet = HELPERS.calculateCancelDate(orderDate);
                            log.debug('setBrandwiseOrderFields', 'cancelDateToSet: ' + cancelDateToSet);

                            if (!!cancelDateToSet) {
                                tranRecord.setValue(CONSTANTS.FIELDS.CANCELDATE, cancelDateToSet);
                            }
                        }
                        // Set 9.5% Shipping Cost of Total
                        if (!!transactionTotal && !!shipMethod) {
                            let shippingCost = HELPERS.calculateShippingCost(transactionTotal);
                            log.debug('setBrandwiseOrderFields', 'shippingCost: ' + shippingCost);
                            if (!!shippingCost) {
                                tranRecord.setValue(CONSTANTS.FIELDS.SHIPPINGCOST, shippingCost);
                            }
                        }
                        tranRecord.save({
                            ignoreMandatoryFields: true
                        });
                    }
                }
                catch (e) {
                    log.error('setBrandwiseOrderFields Excpetion', e);
                }
            },
            calculateCancelDate: (orderDate) => {
                try {
                    const currentDate = new Date(orderDate);
                    const dateToSet = new Date(currentDate.getTime() + (12 * 24 * 60 * 60 * 1000));
                    return dateToSet;
                }
                catch (e) {
                    log.error('calculateCancelDate Exception', e);
                }
            },
            calculateShippingCost: (transactionTotal) => {
                try {
                    const shippingCost = ((transactionTotal * 9.5) / 100).toFixed(2);
                    return shippingCost;
                }
                catch (e) {
                    log.error('calculateShippingCost Exception', e);
                }
            }
        }
        return { CONSTANTS, HELPERS }

    });