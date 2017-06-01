const duToggle = document.getElementById('du-toggle-filters');
const copyTableBtn = document.getElementById('du-copy-table');
const filters = document.getElementsByClassName('du-filters')[0];
const loading = document.getElementsByClassName('du-loading')[0];
const duBtn = document.getElementById('du-submit');
const duSelectEle = document.getElementById('du-select');
const duResult = document.getElementById('du-result');
const duApiPrefix = 'http://st.du.zoomquiet.io';
const duApiVersion = 'v0';

duBtn.addEventListener('click', () => {
    loading.style.display = 'block';
    duResult.innerHTML = '';
    copyTableBtn.disabled = true;
    const type = duSelectEle.value;
    const apiTypes = getCheckedApi();
    if (apiTypes.length === 0 || !type) {
        renderErr('输入不正确, 请重新输入!')
    } else {
        renderErr('');
        const apiUrls = generateApiArr(type, apiTypes);
        const fetchArr = apiUrls.map(api => fetch(api).then(res => res.json()));
        Promise.all(fetchArr)
            .then(resArr => {
                const tableHtml = generateTableHTML(resArr);
                loading.style.display = 'none';
                duResult.innerHTML = tableHtml.join('');
                copyTableBtn.disabled = false;
            });
    }
});

duToggle.addEventListener('click', () => {
    if (duToggle.value === 'off') {
        filters.style.display = 'block';
        duToggle.value = 'on';
        duToggle.textContent = '收起 filters';
    } else {
        filters.style.display = 'none';
        duToggle.value = 'off';
        duToggle.textContent = '更改 filter';
    }
})

copyTableBtn.addEventListener("click", function() {
    const copySucceed = copyToClipboard(duResult);
    if (copySucceed) {
        notifyMe('复制成功!');
    } else {
        notifyMe('复制失败!');
    }
});

function copyToClipboard(elem) {
    // https://stackoverflow.com/a/22581382/5919446
    // create hidden text element, if it doesn't already exist
    const targetId = "_hiddenCopyText_";
    let target = document.getElementById(targetId);
    if (!target) {
        target = document.createElement("textarea");
        target.style.position = "absolute";
        target.style.left = "-9999px";
        target.style.top = "0";
        target.id = targetId;
        document.body.appendChild(target);
    }
    target.textContent = elem.innerHTML;
    // select the content
    const currentFocus = document.activeElement;
    target.focus();
    target.setSelectionRange(0, target.value.length);

    // copy the selection
    let succeed;
    try {
        succeed = document.execCommand("copy");
    } catch (e) {
        succeed = false;
    }
    // restore original focus
    if (currentFocus && typeof currentFocus.focus === "function") {
        currentFocus.focus();
    }
    target.textContent = "";
    return succeed;
}

function renderErr(errorMessage) {
    const error = document.getElementById('du-error-msg');
    if (errorMessage) {
        error.innerHTML = `${errorMessage}<span>X</span>`;
        const duErrSpanBtn = document.querySelector('#du-error-msg span');
        duErrSpanBtn.addEventListener('click', () => renderErr(''));
    } else {
        error.textContent = '';
    }
}

function getCheckedApi() {
    const nodes = document.getElementsByName('du-api-type');
    const checked = [];
    nodes.forEach(node => {
        if (node.checked) {
            checked.push(node.id);
        }
    });
    return checked;
}

function generateApiArr(type, apiTypes, rank = 5) {
    const result = [];
    if (type !== 'both') {
        return apiTypes.map(api =>
            `${duApiPrefix}/${duApiVersion}/${type}/${api}/rank/${rank}/`);
    } else {
        apiTypes.forEach(api => {
            const urlAll = `${duApiPrefix}/${duApiVersion}/all/${api}/rank/${rank}/`;
            const urlWeek = `${duApiPrefix}/${duApiVersion}/week/${api}/rank/${rank}/`;
            result.push(urlAll, urlWeek);
        })
    }
    return result;
}

function generateTableHTML(resArr) {
    return resArr.map(res => {
        const rows = res.data.map((d => {
            return `<tr>
                <td><a href='https://github.com/${d[0]}' target='_blank'>${d[0]}</a></td>
                <td>${d[1]}</td>
            </tr>`;
        }));
        const table = `<table>
            <tbody>
                <tr>
                    <th colspan="2">${res.message}</th>
                </tr>
                ${rows.join('')}
            </tbody>
        </table>`;
        return table;
    });
}

function notifyMe(msg) {
    // https://developer.mozilla.org/en-US/docs/Web/API/notification
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
    } else if (Notification.permission === "granted") {
        var notification = new Notification(msg);
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission(function(permission) {
            if (permission === "granted") {
                var notification = new Notification(msg);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    duBtn.click();
});

chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.create({
        'url': chrome.runtime.getURL('index.html')
    });
});