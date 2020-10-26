import { useState } from 'react';

export default function useForm(defaults) {
  const [values, setValues] = useState(defaults);

  function updateValues(e) {
    // Check if its a number and convert
    let { value } = e.target;
    if (e.target.value === 'number') {
      value = parseInt(e.target.value);
    }

    setValues({
      // Copy de existing values into it
      ...values,
      // update the new value that changed
      [e.target.name]: value,
    });
  }
  return { values, updateValues };
}
