# Override Dimensions Feature Documentation

## Overview
The Override Dimensions feature allows users to bypass the default collection dimensions and weight stored in the database, providing custom values for shipping calculations. This is useful for:
- Special packaging requirements
- Custom crating for valuable pieces
- Multiple items shipping together
- Testing different shipping scenarios

## How to Use

### 1. Enable Override Mode
- Navigate to the "Art Collection Selection" section
- Click the "Override Dimensions" button on the right side
- The button will turn purple and show "Disable Override" when active

### 2. Enter Custom Values
When override mode is enabled, a new form section appears where you can enter:

- **Dimensions (CM)**
  - Length: The longest dimension of your package
  - Width: The second longest dimension
  - Height: The shortest dimension
  
- **Weight (KG)**
  - The actual weight of your package(s)
  
- **Quantity of Boxes**
  - Number of identical packages to ship

### 3. View Calculations
The form automatically displays:
- Total dimensions
- Actual weight
- Dimensional weight (calculated using FedEx formula)
- Billed weight (higher of actual or dimensional weight)
- Total weight for all boxes

### 4. Parameter Preview
The Parameter Preview section will show:
- "Custom" as the size when override is active
- Your custom dimensions and weight
- An "Override Active" badge
- The number of boxes specified

### 5. Calculate Rates
Click the "Calculate Shipping Rates" button to get rates based on your custom values.

## Important Notes

### Validation
- All dimension values must be greater than 0
- Weight must be greater than 0
- Quantity must be a positive integer (1 or more)
- The calculate button will be disabled if any values are invalid

### Size Selector
- When override is enabled, the Size Selector dropdown is disabled
- You don't need to select a size when using custom dimensions

### Data Persistence
- Your override settings are saved in browser localStorage
- They will persist even if you refresh the page
- Use the "Reset to Defaults" button to clear custom values

### FedEx API
- The system sends your custom dimensions directly to FedEx
- FedEx will calculate rates based on the billed weight (higher of actual or dimensional weight)
- Multiple boxes are handled as grouped packages with identical dimensions

## Default Values
When first enabling override mode, the form is populated with default values:
- Length: 40 cm
- Width: 31 cm  
- Height: 28 cm
- Weight: 4 kg
- Quantity: 1 box

## Troubleshooting

### Calculate Button Disabled
If the calculate button is disabled when override is active, check:
1. All dimension fields have valid positive numbers
2. Weight field has a valid positive number
3. Quantity is a positive integer
4. You have selected a collection (still required)
5. All other required fields are filled (origin, destination, etc.)

### Validation Errors
The form will display specific error messages:
- "Length must be greater than 0"
- "Width must be greater than 0"
- "Height must be greater than 0"
- "Weight must be greater than 0"
- "Quantity must be a positive integer"

### No Rates Returned
If FedEx returns no rates:
- Check that dimensions are reasonable for shipping
- Verify the destination is serviceable
- Ensure total weight is within FedEx limits

## Technical Details

### Dimensional Weight Calculation
The system uses FedEx's standard dimensional weight formula:
```
Dimensional Weight = (Length × Width × Height) / 5000
```
Where dimensions are in centimeters and the result is in kilograms.

### Billed Weight
FedEx charges based on the higher of:
- Actual weight
- Dimensional weight

This is automatically calculated and displayed in the form.

### Multiple Boxes
When quantity > 1:
- FedEx treats them as a grouped shipment
- All boxes must have identical dimensions and weight
- The total shipment weight is weight × quantity

## Browser Compatibility
The override feature uses localStorage for persistence, which is supported in all modern browsers:
- Chrome 4+
- Firefox 3.5+
- Safari 4+
- Edge (all versions)
- Opera 11.5+
