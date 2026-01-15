import { Input } from '../shared/ui/input';
import { Label } from '../shared/ui/label';
import { Textarea } from '../shared/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../shared/ui/select';
import { Checkbox } from '../shared/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../shared/ui/radio-group';
import { Card } from '../shared/ui/card';

export function FormComponentsTest() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-[#061623]">Form Components Test</h1>

        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="test-input">Standard Input</Label>
            <Input id="test-input" placeholder="Enter text..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="error-input">Input with Error State</Label>
            <Input id="error-input" aria-invalid="true" placeholder="This input has an error" />
            <p className="text-sm text-[#C1201C]">This field is required</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="disabled-input">Disabled Input</Label>
            <Input id="disabled-input" disabled placeholder="Disabled input" value="Cannot edit" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-textarea">Standard Textarea</Label>
            <Textarea id="test-textarea" placeholder="Enter description..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="auto-resize-textarea">Auto-resize Textarea</Label>
            <Textarea
              id="auto-resize-textarea"
              autoResize
              placeholder="Type here and watch it grow..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-select">Select Dropdown</Label>
            <Select>
              <SelectTrigger id="test-select">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wheat">Wheat</SelectItem>
                <SelectItem value="corn">Corn</SelectItem>
                <SelectItem value="soybeans">Soybeans</SelectItem>
                <SelectItem value="barley">Barley</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="test-checkbox" />
            <Label htmlFor="test-checkbox" className="cursor-pointer">
              I accept the terms and conditions
            </Label>
          </div>

          <div className="space-y-3">
            <Label>Choose a farm type</Label>
            <RadioGroup defaultValue="crop">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="crop" id="radio-crop" />
                <Label htmlFor="radio-crop" className="cursor-pointer">Crop Farm</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="livestock" id="radio-livestock" />
                <Label htmlFor="radio-livestock" className="cursor-pointer">Livestock Farm</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mixed" id="radio-mixed" />
                <Label htmlFor="radio-mixed" className="cursor-pointer">Mixed Farm</Label>
              </div>
            </RadioGroup>
          </div>
        </Card>
      </div>
    </div>
  );
}
