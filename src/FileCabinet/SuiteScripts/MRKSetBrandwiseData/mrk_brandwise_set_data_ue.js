/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
 define(['./mrk_brandwise_data_helper.js'],

 (HELPER) => {
     /**
      * Defines the function definition that is executed after record is saved.
      * @param {Object} scriptContext
      * @since 2015.2
      */
     const afterSubmit = (scriptContext) => {
        try {
            if (scriptContext.type === scriptContext.UserEventType.CREATE) {
                HELPER.HELPERS.setBrandwiseOrderFields(scriptContext);
            }
        }
        catch (e) {
            log.error('afterSubmit Exception', e);
        }
     }

     return { afterSubmit }

 });
