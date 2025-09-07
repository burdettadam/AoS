<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
        <#if message?has_content>
            <#if message.type = 'error'>Something Went Wrong
            <#else>Notice
            </#if>
        <#else>
            Error
        </#if>
    <#elseif section = "form">
    <div id="kc-form">
        <div id="kc-form-wrapper">
            <#if message?has_content>
                <div class="form-info-banner" style="<#if message.type = 'error'>border-color: var(--botc-danger); background: rgba(139,0,0,0.1);</#if>">
                    <h3>
                        <#if message.type = 'error'>⚠️ </#if>
                        ${kcSanitize(message.summary)?no_esc}
                    </h3>
                    <#if message.type = 'error'>
                        <p>We encountered an issue while processing your request. Don't worry, your data is safe.</p>
                    </#if>
                </div>
            </#if>
            
            <div class="${properties.kcFormGroupClass!}">
                <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
                    <#if skipLink??>
                    <#else>
                        <#if client?? && client.baseUrl?has_content>
                            <p><a id="backToApplication" href="${client.baseUrl}">« ${kcSanitize(msg("backToApplication"))?no_esc}</a></p>
                        </#if>
                    </#if>
                    <p><a href="${url.loginUrl}">« Back to Login</a></p>
                </div>
            </div>
        </div>
    </div>
    </#if>
</@layout.registrationLayout>
