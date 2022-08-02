
export function stringifyFormData(obj : object) : string {
    let r = "";
    let addAnd = false;
    for (const k in obj) {
        const v = obj[k];
        if(addAnd) {
            r = r + '&';
        } else {
            addAnd = true;
        }
        r = r + `${k}=${encodeURIComponent(v)}`;
    }

    return r;
}
